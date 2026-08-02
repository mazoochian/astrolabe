import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Certificate, DnsRecord, DnsRecordInput, Zone } from "~/lib/domain";

type ZoneRow = { id: string; name: string; status: Zone["status"] };
type DnsRecordRow = {
  id: string;
  zone_id: string;
  type: DnsRecord["type"];
  name: string;
  content: string;
  ttl: string;
  proxied: number;
};
type CertificateRow = {
  id: string;
  zone_id: string;
  hosts: string;
  authority: string;
  type: string;
  status: Certificate["status"];
  expires: string;
};

const seedCertificates = [
  {
    hosts: "astrolabe.io, *.astrolabe.io",
    authority: "Let's Encrypt",
    type: "Universal",
    status: "Active",
    expires: "12 Oct 2026",
  },
  {
    hosts: "api.astrolabe.io",
    authority: "Google Trust",
    type: "Advanced",
    status: "Active",
    expires: "03 Sep 2026",
  },
  {
    hosts: "beta.astrolabe.io",
    authority: "Let's Encrypt",
    type: "Universal",
    status: "Issuing",
    expires: "—",
  },
] satisfies Array<Omit<Certificate, "id" | "zoneId">>;

const seedRecords: DnsRecordInput[] = [
  { type: "A", name: "@", content: "198.51.100.24", ttl: "Auto", proxied: true },
  { type: "A", name: "www", content: "198.51.100.24", ttl: "Auto", proxied: true },
  {
    type: "CNAME",
    name: "docs",
    content: "astrolabe.pages.dev",
    ttl: "Auto",
    proxied: true,
  },
  { type: "MX", name: "@", content: "mx1.mailhost.net", ttl: "1 h", proxied: false },
  {
    type: "TXT",
    name: "@",
    content: "v=spf1 include:mailhost.net ~all",
    ttl: "Auto",
    proxied: false,
  },
  { type: "AAAA", name: "api", content: "2001:db8::4f21", ttl: "5 min", proxied: true },
];

export function createControlPlaneStore(databasePath: string = defaultDatabasePath()) {
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Active', 'Pending')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    );
    CREATE TABLE IF NOT EXISTS dns_records (
      id TEXT PRIMARY KEY,
      zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      ttl TEXT NOT NULL,
      proxied INTEGER NOT NULL CHECK (proxied IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
      hosts TEXT NOT NULL,
      authority TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Active', 'Issuing')),
      expires TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const toZone = (row: ZoneRow): Zone => ({ ...row });
  const toRecord = (row: DnsRecordRow): DnsRecord => ({
    id: row.id,
    zoneId: row.zone_id,
    type: row.type,
    name: row.name,
    content: row.content,
    ttl: row.ttl,
    proxied: row.proxied === 1,
  });
  const toCertificate = (row: CertificateRow): Certificate => ({
    id: row.id,
    zoneId: row.zone_id,
    hosts: row.hosts,
    authority: row.authority,
    type: row.type,
    status: row.status,
    expires: row.expires,
  });

  const insertRecord = database.prepare(
    `INSERT INTO dns_records (id, zone_id, type, name, content, ttl, proxied)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertCertificate = database.prepare(
    `INSERT INTO certificates (id, zone_id, hosts, authority, type, status, expires)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const seedCertificatesForZone = (zoneId: string) => {
    const existing = database
      .prepare("SELECT id FROM certificates WHERE zone_id = ? LIMIT 1")
      .get(zoneId);
    if (existing) return;
    for (const certificate of seedCertificates) {
      insertCertificate.run(
        randomUUID(),
        zoneId,
        certificate.hosts,
        certificate.authority,
        certificate.type,
        certificate.status,
        certificate.expires,
      );
    }
  };

  const seedForUser = (userId: string) => {
    const existing = database.prepare("SELECT id FROM zones WHERE user_id = ? LIMIT 1").get(userId);
    if (existing) return;

    const insertZone = database.prepare(
      "INSERT INTO zones (id, user_id, name, status) VALUES (?, ?, ?, ?)",
    );
    const zoneId = randomUUID();
    insertZone.run(zoneId, userId, "astrolabe.io", "Active");
    insertZone.run(randomUUID(), userId, "orbit-labs.dev", "Active");
    insertZone.run(randomUUID(), userId, "sextant.app", "Pending");
    for (const record of seedRecords) {
      insertRecord.run(
        randomUUID(),
        zoneId,
        record.type,
        record.name,
        record.content,
        record.ttl,
        Number(record.proxied),
      );
    }
  };

  return {
    listZones(userId: string): Zone[] {
      seedForUser(userId);
      return (
        database
          .prepare("SELECT id, name, status FROM zones WHERE user_id = ? ORDER BY created_at")
          .all(userId) as ZoneRow[]
      ).map(toZone);
    },

    listRecords(userId: string, zoneId: string): DnsRecord[] {
      seedForUser(userId);
      return (
        database
          .prepare(
            `SELECT r.* FROM dns_records r
             JOIN zones z ON z.id = r.zone_id
             WHERE r.zone_id = ? AND z.user_id = ?
             ORDER BY r.created_at`,
          )
          .all(zoneId, userId) as DnsRecordRow[]
      ).map(toRecord);
    },

    createRecord(userId: string, zoneId: string, input: DnsRecordInput): DnsRecord | null {
      const zone = database
        .prepare("SELECT id FROM zones WHERE id = ? AND user_id = ?")
        .get(zoneId, userId);
      if (!zone) return null;

      const record = { id: randomUUID(), zoneId, ...input };
      insertRecord.run(
        record.id,
        zoneId,
        record.type,
        record.name,
        record.content,
        record.ttl,
        Number(record.proxied),
      );
      return record;
    },

    updateRecord(userId: string, id: string, input: DnsRecordInput): DnsRecord | null {
      const result = database
        .prepare(
          `UPDATE dns_records SET type = ?, name = ?, content = ?, ttl = ?, proxied = ?
           WHERE id = ? AND zone_id IN (SELECT id FROM zones WHERE user_id = ?)`,
        )
        .run(input.type, input.name, input.content, input.ttl, Number(input.proxied), id, userId);
      if (result.changes === 0) return null;

      const row = database
        .prepare("SELECT * FROM dns_records WHERE id = ?")
        .get(id) as DnsRecordRow;
      return toRecord(row);
    },

    deleteRecord(userId: string, id: string): boolean {
      const result = database
        .prepare(
          `DELETE FROM dns_records
           WHERE id = ? AND zone_id IN (SELECT id FROM zones WHERE user_id = ?)`,
        )
        .run(id, userId);
      return result.changes > 0;
    },

    listCertificates(userId: string, zoneId: string): Certificate[] {
      const zone = database
        .prepare("SELECT id FROM zones WHERE id = ? AND user_id = ?")
        .get(zoneId, userId);
      if (!zone) return [];
      seedCertificatesForZone(zoneId);
      return (
        database
          .prepare("SELECT * FROM certificates WHERE zone_id = ? ORDER BY created_at")
          .all(zoneId) as CertificateRow[]
      ).map(toCertificate);
    },

    createCertificate(userId: string, zoneId: string, hosts: string): Certificate | null {
      const zone = database
        .prepare("SELECT id FROM zones WHERE id = ? AND user_id = ?")
        .get(zoneId, userId);
      if (!zone) return null;
      const certificate: Certificate = {
        id: randomUUID(),
        zoneId,
        hosts,
        authority: "Let's Encrypt",
        type: "Universal",
        status: "Issuing",
        expires: "—",
      };
      insertCertificate.run(
        certificate.id,
        zoneId,
        certificate.hosts,
        certificate.authority,
        certificate.type,
        certificate.status,
        certificate.expires,
      );
      return certificate;
    },

    close(): void {
      database.close();
    },
  };
}

let store: ReturnType<typeof createControlPlaneStore> | undefined;

export function getControlPlaneStore() {
  store ??= createControlPlaneStore();
  return store;
}

function defaultDatabasePath(): string {
  return resolve(process.env.ASTROLABE_DATABASE_PATH ?? "data/astrolabe.db");
}
