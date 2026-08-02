import assert from "node:assert/strict";
import test from "node:test";
import { createUserStore, hashPassword, verifyPassword } from "./user-store.ts";

test("hashes passwords with unique salts and verifies them", () => {
  const first = hashPassword("correct horse battery staple");
  const second = hashPassword("correct horse battery staple");

  assert.notEqual(first, second);
  assert.equal(verifyPassword("correct horse battery staple", first), true);
  assert.equal(verifyPassword("wrong", first), false);
  assert.equal(verifyPassword("anything", "malformed"), false);
});

test("persists and authenticates users in SQLite", () => {
  const store = createUserStore(":memory:");

  try {
    const created = store.createUser({
      email: "Nadia@Astrolabe.io",
      password: "secret-password",
      displayName: "Nadia Farrell",
      role: "Super Administrator",
    });

    assert.equal(store.count(), 1);
    assert.equal(created.email, "nadia@astrolabe.io");
    assert.deepEqual(store.authenticate("NADIA@ASTROLABE.IO", "secret-password"), created);
    assert.equal(store.authenticate(created.email, "wrong"), null);
    assert.deepEqual(store.findById(created.id), created);
    const updated = store.updateUser(created.id, {
      email: "nadia@example.com",
      displayName: "Nadia Updated",
      theme: "light",
      defaultTtl: "5 min",
      proxyByDefault: false,
    });
    assert.equal(updated?.email, "nadia@example.com");
    assert.equal(updated?.theme, "light");
    assert.equal(updated?.defaultTtl, "5 min");
    assert.equal(updated?.proxyByDefault, false);
  } finally {
    store.close();
  }
});
