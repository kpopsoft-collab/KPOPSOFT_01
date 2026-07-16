import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  decryptWidgetSecret,
  encryptWidgetSecret,
} from "../src/lib/billing/widget/crypto.ts";
import {
  createWidgetIntegrationCommands,
  normalizeWidgetOrigin,
  type WidgetIntegrationCredential,
  type WidgetIntegrationRepository,
} from "../src/lib/billing/widget/integrations.ts";
import { requireWidgetMasterKey } from "../src/lib/billing/widget/runtime.ts";
import { findAdminActionGuardViolations } from "./helpers/admin-action-policy.mts";

const actorId = "11111111-1111-4111-8111-111111111111";
const siteId = "22222222-2222-4222-8222-222222222222";
const integrationId = "33333333-3333-4333-8333-333333333333";
const masterKey = new Uint8Array(32).fill(7);
const siteSecret = new Uint8Array(32).fill(11);

test("master keys require canonical base64 for exactly 32 bytes", () => {
  const encoded = Buffer.from(masterKey).toString("base64");
  assert.deepEqual(requireWidgetMasterKey({ BILLING_WIDGET_MASTER_KEY: encoded }), masterKey);

  for (const value of [
    undefined,
    "",
    Buffer.alloc(31).toString("base64"),
    Buffer.alloc(33).toString("base64"),
    encoded.replace(/=$/, ""),
    "not-base64!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
  ]) {
    assert.throws(
      () => requireWidgetMasterKey({ BILLING_WIDGET_MASTER_KEY: value }),
      /BILLING_WIDGET_MASTER_KEY/,
    );
  }
});

test("AES-256-GCM round-trips and authenticates row-bound context", () => {
  const context = { publicId: "wgt_live_public", siteId, keyVersion: 1 };
  const encrypted = encryptWidgetSecret(siteSecret, masterKey, context);

  assert.equal(encrypted.iv.byteLength, 12);
  assert.equal(encrypted.tag.byteLength, 16);
  assert.deepEqual(
    decryptWidgetSecret(encrypted, masterKey, context),
    siteSecret,
  );
  assert.throws(
    () =>
      decryptWidgetSecret(encrypted, masterKey, {
        ...context,
        siteId: actorId,
      }),
    /decrypt/i,
  );
  assert.throws(
    () => decryptWidgetSecret(encrypted, new Uint8Array(32).fill(9), context),
    /decrypt/i,
  );
});

test("encryption uses a fresh nonce and rejects ciphertext or tag tampering", () => {
  const context = { publicId: "wgt_live_public", siteId, keyVersion: 1 };
  const first = encryptWidgetSecret(siteSecret, masterKey, context);
  const second = encryptWidgetSecret(siteSecret, masterKey, context);
  assert.notDeepEqual(first.iv, second.iv);
  assert.notDeepEqual(first.ciphertext, second.ciphertext);

  for (const field of ["ciphertext", "tag"] as const) {
    const changed = new Uint8Array(first[field]);
    changed[0] ^= 1;
    assert.throws(
      () => decryptWidgetSecret({ ...first, [field]: changed }, masterKey, context),
      /decrypt/i,
    );
  }
});

test("allowed origins normalize exactly and reject unsafe URL forms", () => {
  assert.equal(
    normalizeWidgetOrigin("HTTPS://Example.COM:443/"),
    "https://example.com",
  );
  assert.equal(
    normalizeWidgetOrigin("https://example.com:8443"),
    "https://example.com:8443",
  );
  for (const value of [
    "http://example.com",
    "https://*.example.com",
    "https://example.com/path",
    "https://example.com?query=1",
    "https://user@example.com",
    "null",
    "not a url",
  ]) {
    assert.throws(() => normalizeWidgetOrigin(value), /origin/i, value);
  }
});

function credential(
  overrides: Partial<WidgetIntegrationCredential> = {},
): WidgetIntegrationCredential {
  const context = { publicId: "wgt_live_existing", siteId, keyVersion: 1 };
  const encrypted = encryptWidgetSecret(siteSecret, masterKey, context);
  return {
    id: integrationId,
    publicId: context.publicId,
    siteId,
    keyVersion: 1,
    status: "ACTIVE",
    encryptedSecret: encrypted.ciphertext,
    secretIv: encrypted.iv,
    secretTag: encrypted.tag,
    ...overrides,
  };
}

test("creation returns plaintext once while the repository receives ciphertext only", async () => {
  const inserted: Parameters<WidgetIntegrationRepository["create"]>[0][] = [];
  const repository: WidgetIntegrationRepository = {
    async create(input) {
      inserted.push(input);
      return integrationId;
    },
    async findCredential() {
      return null;
    },
    async rotate() {
      return false;
    },
    async setEnabled() {
      return false;
    },
  };
  const commands = createWidgetIntegrationCommands(repository, {
    masterKey,
    randomSecret: () => new Uint8Array(siteSecret),
    randomPublicId: () => "wgt_live_new_public",
  });

  const result = await commands.createWidgetIntegration(
    actorId,
    siteId,
    "https://EXAMPLE.com/",
  );
  assert.equal(result.publicId, "wgt_live_new_public");
  assert.equal(result.secret, Buffer.from(siteSecret).toString("base64url"));
  const captured = inserted[0];
  assert.ok(captured);
  assert.equal(captured.allowedOrigin, "https://example.com");
  assert.equal("secret" in captured, false);
  assert.doesNotMatch(JSON.stringify(captured), new RegExp(result.secret));
  assert.deepEqual(
    decryptWidgetSecret(
      {
        ciphertext: captured.encryptedSecret,
        iv: captured.secretIv,
        tag: captured.secretTag,
      },
      masterKey,
      { publicId: captured.publicId, siteId, keyVersion: 1 },
    ),
    siteSecret,
  );
});

test("rotation increments the version, invalidates old row context, and blocks disabled rows", async () => {
  let current = credential();
  const repository: WidgetIntegrationRepository = {
    async create() {
      return integrationId;
    },
    async findCredential() {
      return current;
    },
    async rotate(input) {
      current = {
        ...current,
        keyVersion: input.keyVersion,
        encryptedSecret: input.encryptedSecret,
        secretIv: input.secretIv,
        secretTag: input.secretTag,
      };
      return true;
    },
    async setEnabled() {
      return true;
    },
  };
  const commands = createWidgetIntegrationCommands(repository, {
    masterKey,
    randomSecret: () => new Uint8Array(32).fill(19),
    randomPublicId: () => "unused",
  });

  const result = await commands.rotateWidgetIntegration(actorId, integrationId);
  assert.equal(result.keyVersion, 2);
  assert.deepEqual(
    decryptWidgetSecret(
      {
        ciphertext: current.encryptedSecret,
        iv: current.secretIv,
        tag: current.secretTag,
      },
      masterKey,
      { publicId: current.publicId, siteId, keyVersion: 2 },
    ),
    new Uint8Array(32).fill(19),
  );
  assert.throws(
    () =>
      decryptWidgetSecret(
        {
          ciphertext: current.encryptedSecret,
          iv: current.secretIv,
          tag: current.secretTag,
        },
        masterKey,
        { publicId: current.publicId, siteId, keyVersion: 1 },
      ),
    /decrypt/i,
  );

  current = credential({ status: "DISABLED" });
  await assert.rejects(
    commands.rotateWidgetIntegration(actorId, integrationId),
    /disabled/i,
  );
});

test("enable and disable use explicit lifecycle updates", async () => {
  const updates: boolean[] = [];
  const repository: WidgetIntegrationRepository = {
    async create() {
      return integrationId;
    },
    async findCredential() {
      return credential();
    },
    async rotate() {
      return true;
    },
    async setEnabled(input) {
      updates.push(input.enabled);
      return true;
    },
  };
  const commands = createWidgetIntegrationCommands(repository, { masterKey });
  await commands.setWidgetIntegrationEnabled(actorId, integrationId, false);
  await commands.setWidgetIntegrationEnabled(actorId, integrationId, true);
  assert.deepEqual(updates, [false, true]);
});

test("integration actions require recent billing admin and avoid secret persistence", () => {
  const actionSource = readFileSync(
    join(
      process.cwd(),
      "src/app/admin/(shell)/billing/integration-actions.ts",
    ),
    "utf8",
  );
  const serviceSource = readFileSync(
    join(process.cwd(), "src/lib/billing/widget/integrations.ts"),
    "utf8",
  );

  assert.deepEqual(findAdminActionGuardViolations(actionSource), []);
  assert.equal(
    actionSource.match(/requireRecentBillingAuth\("BILLING_ADMIN"\)/g)?.length,
    3,
  );
  assert.doesNotMatch(serviceSource, /metadata:\s*\{[^}]*secret/i);
  assert.doesNotMatch(serviceSource, /console\.(?:log|info|debug)/);
});
