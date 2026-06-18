import test from "node:test";
import assert from "node:assert/strict";
import {
  getBakongConfig,
  getBakongConfigErrors,
} from "../config/bakong.js";

const BAKONG_ENV_KEYS = [
  "BAKONG_ENABLED",
  "BAKONG_ACCOUNT_TYPE",
  "BAKONG_ACCOUNT_ID",
  "BAKONG_ACCOUNT_USERNAME",
  "BAKONG_MERCHANT_NAME",
  "BAKONG_MERCHANT_CITY",
  "BAKONG_PHONE_NUMBER",
  "BAKONG_MERCHANT_ID",
  "BAKONG_ACQUIRING_BANK",
  "BAKONG_TOKEN",
  "BAKONG_API_URL",
];

const withBakongEnv = (values, callback) => {
  const original = Object.fromEntries(
    BAKONG_ENV_KEYS.map((key) => [key, process.env[key]])
  );

  for (const key of BAKONG_ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, values);

  try {
    callback();
  } finally {
    for (const key of BAKONG_ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  }
};

test("individual production configuration is accepted", () => {
  withBakongEnv(
    {
      BAKONG_ACCOUNT_TYPE: "INDIVIDUAL",
      BAKONG_ACCOUNT_ID: "store@bank",
      BAKONG_ACCOUNT_USERNAME: "Cherish Baby Store",
      BAKONG_TOKEN: "production-token",
      BAKONG_API_URL: "https://api-bakong.nbc.gov.kh",
    },
    () => {
      assert.deepEqual(getBakongConfigErrors(getBakongConfig()), []);
    }
  );
});

test("merchant configuration rejects placeholder credentials", () => {
  withBakongEnv(
    {
      BAKONG_ACCOUNT_TYPE: "MERCHANT",
      BAKONG_ACCOUNT_ID: "store@bank",
      BAKONG_ACCOUNT_USERNAME: "Cherish Baby Store",
      BAKONG_MERCHANT_ID: "MERCHANT001",
      BAKONG_ACQUIRING_BANK: "bank",
      BAKONG_TOKEN: "production-token",
      BAKONG_API_URL: "https://api-bakong.nbc.gov.kh",
    },
    () => {
      const errors = getBakongConfigErrors(getBakongConfig());
      assert.ok(errors.some((error) => error.includes("Real BAKONG_MERCHANT_ID")));
    }
  );
});

test("disabled Bakong payments do not require credentials", () => {
  withBakongEnv({ BAKONG_ENABLED: "false" }, () => {
    assert.deepEqual(getBakongConfigErrors(getBakongConfig()), []);
  });
});
