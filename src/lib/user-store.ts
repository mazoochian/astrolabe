import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DEFAULT_DEMO_CREDENTIALS = {
  email: "nadia@astrolabe.io",
  password: "astrolabe-demo-2026",
} as const;

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: string;
};

const SCRYPT_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, salt, expectedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === SCRYPT_KEY_LENGTH && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createUserStore(databasePath: string = defaultDatabasePath()) {
  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const toUser = (row: UserRow): User => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  });

  return {
    createUser(input: {
      email: string;
      password: string;
      displayName: string;
      role: string;
    }): User {
      const user = {
        id: randomUUID(),
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName.trim(),
        role: input.role,
      };
      database
        .prepare(
          `INSERT INTO users (id, email, password_hash, display_name, role)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(user.id, user.email, hashPassword(input.password), user.displayName, user.role);
      return user;
    },

    findById(id: string): User | null {
      const row = database.prepare("SELECT * FROM users WHERE id = ?").get(id) as
        UserRow | undefined;
      return row ? toUser(row) : null;
    },

    authenticate(email: string, password: string): User | null {
      const row = database.prepare("SELECT * FROM users WHERE email = ?").get(email.trim()) as
        UserRow | undefined;
      if (!row || !verifyPassword(password, row.password_hash)) return null;
      return toUser(row);
    },

    count(): number {
      const row = database.prepare("SELECT COUNT(*) AS count FROM users").get() as {
        count: number;
      };
      return row.count;
    },

    close(): void {
      database.close();
    },
  };
}

let store: ReturnType<typeof createUserStore> | undefined;

export function getUserStore(): ReturnType<typeof createUserStore> {
  if (!store) {
    store = createUserStore();
    if (store.count() === 0) {
      store.createUser({
        email: process.env.ASTROLABE_DEMO_EMAIL ?? DEFAULT_DEMO_CREDENTIALS.email,
        password: process.env.ASTROLABE_DEMO_PASSWORD ?? DEFAULT_DEMO_CREDENTIALS.password,
        displayName: "Nadia Farrell",
        role: "Super Administrator",
      });
    }
  }
  return store;
}

function defaultDatabasePath(): string {
  return resolve(process.env.ASTROLABE_DATABASE_PATH ?? "data/astrolabe.db");
}
