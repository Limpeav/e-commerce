import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCambodiaMobilePhone } from "../utils/cambodiaPhone.js";

test("normalizes standard Cambodia mobile prefixes", () => {
  assert.equal(normalizeCambodiaMobilePhone("012 345 678"), "+85512345678");
  assert.equal(normalizeCambodiaMobilePhone("+855 16 568 335"), "+85516568335");
  assert.equal(normalizeCambodiaMobilePhone("០១២៣៤៥៦៧៨"), "+85512345678");
});

test("normalizes seven-digit subscriber prefixes", () => {
  assert.equal(normalizeCambodiaMobilePhone("096 123 4567"), "+855961234567");
  assert.equal(normalizeCambodiaMobilePhone("+855 88 123 4567"), "+855881234567");
});

test("rejects unknown prefixes and incorrect lengths", () => {
  assert.equal(normalizeCambodiaMobilePhone("013 123 456"), null);
  assert.equal(normalizeCambodiaMobilePhone("096 123 456"), null);
  assert.equal(normalizeCambodiaMobilePhone("012 345 67"), null);
  assert.equal(normalizeCambodiaMobilePhone("+1 202 555 0123"), null);
  assert.equal(normalizeCambodiaMobilePhone(""), null);
});
