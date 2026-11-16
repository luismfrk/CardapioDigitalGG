import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importOfficialMenu } from "./official-menu.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
fs.mkdirSync(path.join(root, "data"), { recursive: true });
export const db = new Database(path.join(root, "data", "encantos.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, icon TEXT DEFAULT '', image_url TEXT DEFAULT '', sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '', ingredients TEXT DEFAULT '', price INTEGER NOT NULL, promo_price INTEGER, category_id INTEGER NOT NULL REFERENCES categories(id), image_url TEXT DEFAULT '', featured INTEGER DEFAULT 0, available INTEGER DEFAULT 1, visible INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0, demo INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS option_groups (id INTEGER PRIMARY KEY, name TEXT NOT NULL, selection_type TEXT NOT NULL DEFAULT 'single', required INTEGER DEFAULT 0, min_choices INTEGER DEFAULT 0, max_choices INTEGER DEFAULT 1, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS option_items (id INTEGER PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE, name TEXT NOT NULL, price_delta INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS product_option_groups (product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE, PRIMARY KEY(product_id, group_id));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, applied_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, window_started INTEGER NOT NULL, blocked_until INTEGER);
`);

const settings = {
  business_name: "Encantos Burger",
  whatsapp: "",
  instagram: "encantosburguer",
  address: "R. Hilário Wavruk, 82-SW, sala 01 — Centro, Mallet - PR, 84570-000",
  hours: "Terça a sexta e domingo: 17h às 23h. Sábado: 17h à 1h.",
  logo_url: "",
  delivery_enabled: "1",
  pickup_enabled: "1",
  delivery_fee: "",
  delivery_fee_mode: "consult",
  minimum_order: "",
  order_intro: "Olá! Gostaria de fazer um pedido:",
  about:
    "Somos a melhor hamburgueria da cidade de Mallet. Entregamos uma experiência única para nossos clientes e, além de hambúrgueres, oferecemos o chopp mais gelado e barato da região. Também disponibilizamos outras variedades de lanches!",
  notice: "",
  open_mode: "manual",
  manual_open: "1",
  schedule_json: "",
  hero_title: "SEU PRÓXIMO BURGER FAVORITO.",
  hero_subtitle: "Sabor artesanal em cada mordida.",
  hero_image: "/assets/hero-burger.png",
  hero_button: "Ver cardápio",
};
const upsertSetting = db.prepare(
  "INSERT OR IGNORE INTO settings (key,value) VALUES (?,?)",
);
Object.entries(settings).forEach(([key, value]) =>
  upsertSetting.run(key, value),
);

if (!db.prepare("SELECT 1 FROM categories LIMIT 1").get()) {
  const addCategory = db.prepare(
    "INSERT INTO categories (name, sort_order) VALUES (?,?)",
  );
  const ids = ["Burgers", "Combos", "Acompanhamentos", "Bebidas"].map(
    (name, i) => Number(addCategory.run(name, i).lastInsertRowid),
  );
  const addProduct = db.prepare(
    "INSERT INTO products (name,description,ingredients,price,category_id,image_url,featured,sort_order,demo) VALUES (?,?,?,?,?,?,?,?,1)",
  );
  addProduct.run(
    "Clássico",
    "O tradicional que nunca decepciona.",
    "Burger artesanal, queijo, alface, tomate e cebola roxa.",
    2590,
    ids[0],
    "/assets/hero-burger.png",
    1,
    0,
  );
  addProduct.run(
    "Duplo Cheddar",
    "Dois burgers artesanais com muito cheddar cremoso.",
    "Pão brioche, dois burgers e cheddar.",
    3490,
    ids[0],
    "/assets/hero-burger.png",
    1,
    1,
  );
  addProduct.run(
    "Bacon Burger",
    "Burger artesanal com bacon crocante.",
    "Burger, cheddar, bacon, alface e tomate.",
    3190,
    ids[0],
    "/assets/hero-burger.png",
    1,
    2,
  );
}

// Categorias identificadas no cardápio oficial fornecido. A inclusão é
// idempotente e não altera nem remove categorias já administradas pelo painel.
const officialMenuCategories = [
  "Burgers",
  "Lançamentos",
  "Porções",
  "Tábua de Carnes",
  "Pizzas Salgadas",
  "Pizzas Doces",
  "Pastéis Salgados",
  "Pastéis Doces",
  "Sobremesas",
  "Drinks Alcoólicos",
  "Caipiras",
  "Sucos",
  "Drinks sem Álcool",
];
const findCategoryByName = db.prepare(
  "SELECT id FROM categories WHERE lower(name)=lower(?) LIMIT 1",
);
const addOfficialCategory = db.prepare(
  "INSERT INTO categories (name, sort_order, active) VALUES (?,?,1)",
);
officialMenuCategories.forEach((name, index) => {
  if (!findCategoryByName.get(name)) addOfficialCategory.run(name, index * 10);
});
importOfficialMenu(db);

export const settingsObject = () =>
  Object.fromEntries(
    db
      .prepare("SELECT key,value FROM settings")
      .all()
      .map(({ key, value }) => [key, value]),
  );
export const publicCatalog = () => {
  const categories = db
    .prepare("SELECT * FROM categories WHERE active=1 ORDER BY sort_order,name")
    .all();
  const products = db
    .prepare(
      `SELECT p.*, c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.visible=1 AND c.active=1 ORDER BY c.sort_order,c.name,p.sort_order,p.name`,
    )
    .all();
  const groups = db
    .prepare(`SELECT g.* FROM option_groups g WHERE g.active=1`)
    .all();
  const items = db.prepare("SELECT * FROM option_items WHERE active=1").all();
  const links = db.prepare("SELECT * FROM product_option_groups").all();
  for (const p of products)
    p.option_groups = links
      .filter((l) => l.product_id === p.id)
      .map((l) => ({
        ...groups.find((g) => g.id === l.group_id),
        items: items.filter((i) => i.group_id === l.group_id),
      }))
      .filter((g) => g.id);
  return { categories, products, settings: settingsObject() };
};
