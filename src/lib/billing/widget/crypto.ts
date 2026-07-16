import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

export type WidgetSecretContext = {
  publicId: string;
  siteId: string;
  keyVersion: number;
};

export type EncryptedSecret = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  tag: Uint8Array;
};

function assertLength(
  value: Uint8Array,
  length: number,
  label: string,
): void {
  if (value.byteLength !== length) {
    throw new Error(`${label} must be ${length} bytes`);
  }
}

function additionalData(context: WidgetSecretContext | undefined): Buffer {
  if (!context) return Buffer.alloc(0);
  if (
    !context.publicId ||
    !context.siteId ||
    !Number.isSafeInteger(context.keyVersion) ||
    context.keyVersion < 1
  ) {
    throw new Error("Invalid widget secret context");
  }
  return Buffer.from(
    JSON.stringify([
      "kpopsoft-widget-secret-v1",
      context.publicId,
      context.siteId,
      context.keyVersion,
    ]),
    "utf8",
  );
}

export function generateWidgetSecret(): Uint8Array {
  return new Uint8Array(randomBytes(32));
}

export function encodeWidgetSecret(secret: Uint8Array): string {
  assertLength(secret, 32, "Widget secret");
  return Buffer.from(secret).toString("base64url");
}

export function encryptWidgetSecret(
  secret: Uint8Array,
  masterKey: Uint8Array,
  context?: WidgetSecretContext,
): EncryptedSecret {
  assertLength(secret, 32, "Widget secret");
  assertLength(masterKey, 32, "Widget master key");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey, iv);
  cipher.setAAD(additionalData(context));
  const ciphertext = Buffer.concat([
    cipher.update(secret),
    cipher.final(),
  ]);

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: new Uint8Array(iv),
    tag: new Uint8Array(cipher.getAuthTag()),
  };
}

export function decryptWidgetSecret(
  value: EncryptedSecret,
  masterKey: Uint8Array,
  context?: WidgetSecretContext,
): Uint8Array {
  assertLength(masterKey, 32, "Widget master key");
  assertLength(value.iv, 12, "Widget secret IV");
  assertLength(value.tag, 16, "Widget secret tag");

  try {
    const decipher = createDecipheriv("aes-256-gcm", masterKey, value.iv);
    decipher.setAAD(additionalData(context));
    decipher.setAuthTag(value.tag);
    const plaintext = Buffer.concat([
      decipher.update(value.ciphertext),
      decipher.final(),
    ]);
    assertLength(plaintext, 32, "Widget secret");
    return new Uint8Array(plaintext);
  } catch {
    throw new Error("Unable to decrypt widget secret");
  }
}
