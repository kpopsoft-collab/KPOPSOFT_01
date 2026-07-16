import assert from "node:assert/strict";
import test from "node:test";

import {
  bankTransferConfig,
  tossPublicConfig,
  tossServerConfig,
} from "../src/lib/billing/payments/runtime.ts";

test("bank transfer is hidden unless the flag and every display field are complete", () => {
  const complete = {
    BANK_TRANSFER_ENABLED: "true",
    BANK_ACCOUNT_BANK: "국민은행",
    BANK_ACCOUNT_NUMBER: "123-456-789012",
    BANK_ACCOUNT_HOLDER: "케이팝소프트",
  };
  assert.deepEqual(bankTransferConfig(complete), {
    bank: "국민은행",
    accountNumber: "123-456-789012",
    holder: "케이팝소프트",
  });
  assert.equal(bankTransferConfig({ ...complete, BANK_TRANSFER_ENABLED: "false" }), null);
  for (const key of [
    "BANK_ACCOUNT_BANK",
    "BANK_ACCOUNT_NUMBER",
    "BANK_ACCOUNT_HOLDER",
  ]) {
    assert.equal(bankTransferConfig({ ...complete, [key]: "" }), null, key);
  }
});

test("bank transfer rejects control characters and implausible account data", () => {
  const base = {
    BANK_TRANSFER_ENABLED: "true",
    BANK_ACCOUNT_BANK: "국민은행",
    BANK_ACCOUNT_NUMBER: "123-456-789012",
    BANK_ACCOUNT_HOLDER: "케이팝소프트",
  };
  assert.equal(bankTransferConfig({ ...base, BANK_ACCOUNT_BANK: "은행\n주입" }), null);
  assert.equal(bankTransferConfig({ ...base, BANK_ACCOUNT_NUMBER: "abc-secret" }), null);
  assert.equal(bankTransferConfig({ ...base, BANK_ACCOUNT_HOLDER: " " }), null);
});

const tossTestEnv = {
  NODE_ENV: "test",
  TOSS_PAYMENTS_ENABLED: "true",
  TOSS_PAYMENTS_CLIENT_KEY: "test_gck_clientvalue123456",
  TOSS_PAYMENTS_SECRET_KEY: "test_gsk_secretvalue123456",
  TOSS_PAYMENTS_MID: "tosstestmid",
};

test("Toss stays disabled until the full server key set is valid", () => {
  for (const key of [
    "TOSS_PAYMENTS_CLIENT_KEY",
    "TOSS_PAYMENTS_SECRET_KEY",
    "TOSS_PAYMENTS_MID",
  ]) {
    assert.equal(tossServerConfig({ ...tossTestEnv, [key]: "" }), null, key);
    assert.equal(tossPublicConfig({ ...tossTestEnv, [key]: "" }), null, key);
  }
});

test("disabling new Toss entry keeps server recovery configured", () => {
  const recoveryOnly = { ...tossTestEnv, TOSS_PAYMENTS_ENABLED: "false" };
  assert.deepEqual(tossServerConfig(recoveryOnly), {
    secretKey: "test_gsk_secretvalue123456",
    mid: "tosstestmid",
    apiBase: "https://api.tosspayments.com",
    mode: "test",
  });
  assert.equal(tossPublicConfig(recoveryOnly), null);
});

test("Toss rejects test/live and widget/individual key mismatches", () => {
  for (const env of [
    { ...tossTestEnv, TOSS_PAYMENTS_SECRET_KEY: "live_gsk_secretvalue123456" },
    { ...tossTestEnv, TOSS_PAYMENTS_SECRET_KEY: "test_sk_secretvalue123456" },
    { ...tossTestEnv, TOSS_PAYMENTS_CLIENT_KEY: "not_a_client_key" },
  ]) {
    assert.equal(tossServerConfig(env), null);
    assert.equal(tossPublicConfig(env), null);
  }
});

test("production uses only the official HTTPS API base", () => {
  assert.equal(
    tossServerConfig({
      ...tossTestEnv,
      NODE_ENV: "production",
      TOSS_PAYMENTS_API_BASE: "http://api.tosspayments.com",
    }),
    null,
  );
  assert.equal(
    tossServerConfig({
      ...tossTestEnv,
      NODE_ENV: "production",
      TOSS_PAYMENTS_API_BASE: "https://proxy.example.com",
    }),
    null,
  );
  assert.equal(
    tossServerConfig({
      ...tossTestEnv,
      TOSS_PAYMENTS_API_BASE: "http://127.0.0.1:43123",
    })?.apiBase,
    "http://127.0.0.1:43123",
  );
});

test("complete Toss test mode exposes only the client key publicly", () => {
  assert.deepEqual(tossServerConfig(tossTestEnv), {
    secretKey: "test_gsk_secretvalue123456",
    mid: "tosstestmid",
    apiBase: "https://api.tosspayments.com",
    mode: "test",
  });
  const publicConfig = tossPublicConfig(tossTestEnv);
  assert.deepEqual(publicConfig, {
    clientKey: "test_gck_clientvalue123456",
  });
  assert.doesNotMatch(JSON.stringify(publicConfig), /secret|mid|apiBase/i);
});
