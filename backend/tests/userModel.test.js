import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/userModel.js";

test("seller accounts default to the morning shift", async () => {
  const user = new User({
    name: "Seller",
    email: "seller@example.com",
    role: "seller",
  });

  await user.validate();

  assert.equal(user.shift, "morning");
});

test("seller accounts reject unknown shifts", async () => {
  const user = new User({
    name: "Seller",
    email: "seller-invalid@example.com",
    role: "seller",
    shift: "night",
  });

  await assert.rejects(
    () => user.validate(),
    (error) => error?.errors?.shift?.kind === "enum"
  );
});

test("non-seller accounts do not keep seller shifts", async () => {
  const user = new User({
    name: "Delivery",
    email: "delivery@example.com",
    role: "delivery",
    shift: "morning",
  });

  await user.validate();

  assert.equal(user.shift, undefined);
});
