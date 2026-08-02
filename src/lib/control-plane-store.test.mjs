import assert from "node:assert/strict";
import test from "node:test";
import { createControlPlaneStore } from "./control-plane-store.ts";

test("seeds zones and DNS records once per user", () => {
  const store = createControlPlaneStore(":memory:");

  try {
    const zones = store.listZones("user-1");
    assert.deepEqual(
      zones.map(({ name, status }) => ({ name, status })),
      [
        { name: "astrolabe.io", status: "Active" },
        { name: "orbit-labs.dev", status: "Active" },
        { name: "sextant.app", status: "Pending" },
      ],
    );
    assert.equal(store.listZones("user-1").length, 3);
    assert.equal(store.listRecords("user-1", zones[0].id).length, 6);
    assert.equal(store.listRecords("user-2", zones[0].id).length, 0);
  } finally {
    store.close();
  }
});

test("creates, updates, and deletes records within the owning user's zone", () => {
  const store = createControlPlaneStore(":memory:");

  try {
    const zone = store.listZones("owner")[0];
    const created = store.createRecord("owner", zone.id, {
      type: "A",
      name: "status",
      content: "203.0.113.42",
      ttl: "Auto",
      proxied: true,
    });

    assert.ok(created);
    assert.equal(store.createRecord("other-user", zone.id, created), null);
    assert.equal(
      store.updateRecord("other-user", created.id, { ...created, content: "203.0.113.43" }),
      null,
    );

    const updated = store.updateRecord("owner", created.id, {
      ...created,
      content: "203.0.113.43",
    });
    assert.equal(updated?.content, "203.0.113.43");
    assert.equal(store.deleteRecord("other-user", created.id), false);
    assert.equal(store.deleteRecord("owner", created.id), true);
    assert.equal(store.deleteRecord("owner", created.id), false);
  } finally {
    store.close();
  }
});
