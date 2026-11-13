import "dotenv/config";
import pg from "pg";
import { db as sqlite } from "./db.js";

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
});
await client.connect();

await client.query(`
CREATE TABLE IF NOT EXISTS admins (id BIGSERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS categories (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, icon TEXT DEFAULT '', image_url TEXT DEFAULT '', sort_order INTEGER DEFAULT 0, active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS products (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', ingredients TEXT DEFAULT '', price INTEGER NOT NULL, promo_price INTEGER, category_id BIGINT NOT NULL REFERENCES categories(id), image_url TEXT DEFAULT '', featured BOOLEAN DEFAULT false, available BOOLEAN DEFAULT true, visible BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0, demo BOOLEAN DEFAULT false, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS option_groups (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, selection_type TEXT NOT NULL DEFAULT 'single', required BOOLEAN DEFAULT false, min_choices INTEGER DEFAULT 0, max_choices INTEGER DEFAULT 1, active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS option_items (id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE, name TEXT NOT NULL, price_delta INTEGER DEFAULT 0, active BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS product_option_groups (product_id BIGINT REFERENCES products(id) ON DELETE CASCADE, group_id BIGINT REFERENCES option_groups(id) ON DELETE CASCADE, PRIMARY KEY(product_id,group_id));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
`);

const copy = async (table, columns, rows) => {
  if (!rows.length) return;
  const values = columns.map((_, i) => `$${i + 1}`).join(",");
  const updates = columns
    .filter((c) => c !== "id" && c !== "key")
    .map((c) => `${c}=EXCLUDED.${c}`)
    .join(",");
  const conflict = columns.includes("key") ? "key" : "id";
  const sql = `INSERT INTO ${table} (${columns.join(",")}) VALUES (${values}) ON CONFLICT (${conflict}) DO ${updates ? `UPDATE SET ${updates}` : "NOTHING"}`;
  for (const row of rows)
    await client.query(
      sql,
      columns.map((c) => row[c]),
    );
};

await client.query("BEGIN");
try {
  await copy(
    "admins",
    ["id", "email", "password_hash", "created_at"],
    sqlite.prepare("SELECT * FROM admins").all(),
  );
  await copy(
    "categories",
    ["id", "name", "icon", "image_url", "sort_order", "active"],
    sqlite.prepare("SELECT * FROM categories").all(),
  );
  await copy(
    "products",
    [
      "id",
      "name",
      "description",
      "ingredients",
      "price",
      "promo_price",
      "category_id",
      "image_url",
      "featured",
      "available",
      "visible",
      "sort_order",
      "demo",
      "updated_at",
    ],
    sqlite.prepare("SELECT * FROM products").all(),
  );
  await copy(
    "option_groups",
    [
      "id",
      "name",
      "selection_type",
      "required",
      "min_choices",
      "max_choices",
      "active",
    ],
    sqlite.prepare("SELECT * FROM option_groups").all(),
  );
  await copy(
    "option_items",
    ["id", "group_id", "name", "price_delta", "active"],
    sqlite.prepare("SELECT * FROM option_items").all(),
  );
  for (const row of sqlite.prepare("SELECT * FROM product_option_groups").all())
    await client.query(
      "INSERT INTO product_option_groups VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [row.product_id, row.group_id],
    );
  await copy(
    "settings",
    ["key", "value"],
    sqlite.prepare("SELECT * FROM settings").all(),
  );
  for (const table of [
    "admins",
    "categories",
    "products",
    "option_groups",
    "option_items",
  ])
    await client.query(
      `SELECT setval(pg_get_serial_sequence('${table}','id'), COALESCE((SELECT MAX(id) FROM ${table}),1), true)`,
    );
  await client.query("COMMIT");
  console.log("Migração para Postgres concluída.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  sqlite.close();
  await client.end();
}
