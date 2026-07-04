import test from "node:test";
import assert from "node:assert/strict";
import { assertSecurityConfig } from "../config/security.js";

const withProductionEnv = (overrides, callback) => {
  const keys = ["NODE_ENV", "JWT_SECRET", "ALLOWED_ORIGINS", "ALLOW_LOCAL_DEV_ORIGINS"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  Object.assign(process.env, {
    NODE_ENV: "production",
    JWT_SECRET: "a-secure-random-test-secret-with-32-characters",
    ALLOWED_ORIGINS: "https://example.com",
    ...overrides,
  });

  if (overrides.ALLOW_LOCAL_DEV_ORIGINS === undefined) {
    delete process.env.ALLOW_LOCAL_DEV_ORIGINS;
  }

  try {
    callback();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
};

test("production disables local development origins when the setting is omitted", () => {
  withProductionEnv({}, () => {
    assert.doesNotThrow(() => assertSecurityConfig());
  });
});

test("production rejects explicitly enabled local development origins", () => {
  withProductionEnv({ ALLOW_LOCAL_DEV_ORIGINS: "true" }, () => {
    assert.throws(
      () => assertSecurityConfig(),
      /ALLOW_LOCAL_DEV_ORIGINS must be false/
    );
  });
});
