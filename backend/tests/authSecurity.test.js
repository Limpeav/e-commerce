import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  createPortalSessionToken,
  hashLoginCode,
  isGmailAddress,
  normalizeEmail,
  safeEqual,
  validateCustomerPassword,
  validatePortalPassword,
} from "../utils/authSecurity.js";

test("portal sessions persist until explicit revocation", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

  try {
    const adminToken = createPortalSessionToken({
      _id: "507f1f77bcf86cd799439011",
      role: "admin",
      tokenVersion: 0,
    });
    const sellerToken = createPortalSessionToken({
      _id: "507f1f77bcf86cd799439012",
      role: "seller",
      tokenVersion: 0,
    });

    assert.equal(jwt.decode(adminToken).exp, undefined);
    assert.equal(jwt.decode(sellerToken).exp, undefined);
  } finally {
    process.env.JWT_SECRET = previousSecret;
  }
});

test("portal password policy rejects weak passwords", () => {
  assert.equal(validatePortalPassword("admin123").valid, false);
  assert.equal(validatePortalPassword("longbutnouppercase1!").valid, false);
});

test("portal password policy accepts a strong password", () => {
  assert.equal(validatePortalPassword("ThesisPlus#2026").valid, true);
});

test("customer password policy rejects weak passwords", () => {
  assert.equal(validateCustomerPassword("password").valid, false);
});

test("customer password policy accepts a strong password", () => {
  assert.equal(validateCustomerPassword("Cherish9!Baby").valid, true);
});

test("email normalization is consistent", () => {
  assert.equal(normalizeEmail(" ThesisPlus2026@GMAIL.com "), "thesisplus2026@gmail.com");
});

test("customer Gmail validation only accepts gmail.com addresses", () => {
  assert.equal(isGmailAddress(" Customer.Name+tag@GMAIL.com "), true);
  assert.equal(isGmailAddress("customer@yahoo.com"), false);
  assert.equal(isGmailAddress("customer@gmail.com.kh"), false);
});

test("login code hashes are challenge-specific and compared safely", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

  const firstHash = hashLoginCode("123456", "challenge-one");
  const secondHash = hashLoginCode("123456", "challenge-two");

  assert.equal(safeEqual(firstHash, firstHash), true);
  assert.equal(safeEqual(firstHash, secondHash), false);

  process.env.JWT_SECRET = previousSecret;
});
