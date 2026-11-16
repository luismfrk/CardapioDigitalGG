import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import multer from "multer";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db, publicCatalog, settingsObject } from "./db.js";
import {
  inspectImage,
  normalizeWhatsApp,
  parseSchedule,
  validateCategoryPayload,
  validateCart,
  validateGroupPayload,
  validateImageUrl,
  validateProductPayload,
} from "./business-rules.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();
const port = Number(process.env.PORT || 3001);
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET)
  throw new Error("SESSION_SECRET é obrigatória em produção.");
class SQLiteSessionStore extends session.Store {
  constructor(database) {
    super();
    this.database = database;
    this.database.exec(
      "CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expires INTEGER NOT NULL)",
    );
  }
  get(sid, callback) {
    try {
      const row = this.database
        .prepare("SELECT sess,expires FROM sessions WHERE sid=?")
        .get(sid);
      if (!row || row.expires < Date.now()) {
        if (row) this.destroy(sid, () => {});
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (error) {
      callback(error);
    }
  }
  set(sid, sess, callback = () => {}) {
    try {
      const expires = sess.cookie?.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + 86400000;
      this.database
        .prepare(
          "INSERT INTO sessions VALUES (?,?,?) ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess,expires=excluded.expires",
        )
        .run(sid, JSON.stringify(sess), expires);
      callback();
    } catch (error) {
      callback(error);
    }
  }
  destroy(sid, callback = () => {}) {
    try {
      this.database.prepare("DELETE FROM sessions WHERE sid=?").run(sid);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  session({
    name: "encantos.sid",
    store: new SQLiteSessionStore(db),
    secret: process.env.SESSION_SECRET || "development-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
app.use(
  "/uploads",
  express.static(path.join(root, "uploads"), { maxAge: "1d" }),
);

const auth = (req, res, next) =>
  req.session.adminId
    ? next()
    : res.status(401).json({ error: "Acesso administrativo necessário." });
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(root, "uploads"),
    filename: (_, file, cb) =>
      cb(
        null,
        `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const bool = (value) => (value ? 1 : 0);
const settingKeys = {
  appearance: new Set([
    "hero_title",
    "hero_subtitle",
    "hero_button",
    "hero_image",
    "about",
    "notice",
  ]),
  business: new Set([
    "business_name",
    "logo_url",
    "whatsapp",
    "instagram",
    "address",
    "hours",
    "delivery_enabled",
    "pickup_enabled",
    "delivery_fee_mode",
    "delivery_fee",
    "minimum_order",
    "order_intro",
    "open_mode",
    "manual_open",
    "schedule_json",
  ]),
};
const validateSettings = (section, values) => {
  const allowed = settingKeys[section];
  if (
    !allowed ||
    !values ||
    typeof values !== "object" ||
    Array.isArray(values)
  )
    return "Configurações inválidas.";
  if (Object.keys(values).some((key) => !allowed.has(key)))
    return "A seção contém uma configuração não permitida.";
  if (Object.values(values).some((value) => String(value ?? "").length > 2000))
    return "Um campo excede o limite permitido.";
  if (values.whatsapp && !normalizeWhatsApp(values.whatsapp))
    return "Informe o WhatsApp com DDI e DDD.";
  for (const key of ["logo_url", "hero_image"])
    if (values[key] && !validateImageUrl(values[key]))
      return "URL de imagem inválida.";
  if (values.schedule_json && !parseSchedule(values.schedule_json))
    return "A agenda semanal contém horários inválidos.";
  return "";
};
const syncGroupRelations = (groupId, body) => {
  const existingIds = new Set(
    db
      .prepare("SELECT id FROM option_items WHERE group_id=?")
      .all(groupId)
      .map((item) => Number(item.id)),
  );
  const keptIds = new Set();
  const updateItem = db.prepare(
    "UPDATE option_items SET name=?,price_delta=?,active=? WHERE id=? AND group_id=?",
  );
  const insertItem = db.prepare(
    "INSERT INTO option_items (group_id,name,price_delta,active) VALUES (?,?,?,?)",
  );
  for (const item of body.items || []) {
    const itemId = Number(item.id);
    if (Number.isSafeInteger(itemId) && existingIds.has(itemId)) {
      updateItem.run(
        item.name.trim(),
        Number(item.price_delta || 0),
        bool(item.active),
        itemId,
        groupId,
      );
      keptIds.add(itemId);
    } else {
      const result = insertItem.run(
        groupId,
        item.name.trim(),
        Number(item.price_delta || 0),
        bool(item.active),
      );
      keptIds.add(Number(result.lastInsertRowid));
    }
  }
  for (const itemId of existingIds)
    if (!keptIds.has(itemId))
      db.prepare("UPDATE option_items SET active=0 WHERE id=?").run(itemId);
  db.prepare("DELETE FROM product_option_groups WHERE group_id=?").run(groupId);
  const link = db.prepare(
    "INSERT INTO product_option_groups VALUES (?,?) ON CONFLICT DO NOTHING",
  );
  for (const productId of body.product_ids || []) link.run(productId, groupId);
};

app.get("/api/catalog", (_req, res) => res.json(publicCatalog()));
app.post("/api/cart/validate", (req, res) => {
  const result = validateCart({
    cartItems: req.body.items,
    fulfillment: req.body.fulfillment,
    products: db.prepare("SELECT * FROM products").all(),
    categories: db.prepare("SELECT * FROM categories").all(),
    groups: db.prepare("SELECT * FROM option_groups").all(),
    optionItems: db.prepare("SELECT * FROM option_items").all(),
    links: db.prepare("SELECT * FROM product_option_groups").all(),
    settings: settingsObject(),
  });
  res.status(result.ok ? 200 : 422).json(result);
});
app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const attemptKey = crypto
    .createHash("sha256")
    .update(`${req.ip}:${email}`)
    .digest("hex");
  const now = Date.now();
  const attempt = db
    .prepare("SELECT * FROM login_attempts WHERE key=?")
    .get(attemptKey);
  if (attempt?.blocked_until > now)
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  const admin = db.prepare("SELECT * FROM admins WHERE email=?").get(email);
  if (
    !admin ||
    !(await bcrypt.compare(
      String(req.body.password || ""),
      admin.password_hash,
    ))
  ) {
    const attempts =
      attempt && now - attempt.window_started < 15 * 60_000
        ? attempt.attempts + 1
        : 1;
    db.prepare(
      "INSERT INTO login_attempts VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,window_started=excluded.window_started,blocked_until=excluded.blocked_until",
    ).run(
      attemptKey,
      attempts,
      attempt?.window_started || now,
      attempts >= 5 ? now + 15 * 60_000 : null,
    );
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }
  db.prepare("DELETE FROM login_attempts WHERE key=?").run(attemptKey);
  req.session.adminId = admin.id;
  res.json({ email: admin.email });
});
app.post("/api/auth/logout", (req, res) =>
  req.session.destroy(() => res.json({ ok: true })),
);
app.get("/api/auth/me", (req, res) => {
  const admin =
    req.session.adminId &&
    db
      .prepare("SELECT id,email FROM admins WHERE id=?")
      .get(req.session.adminId);
  admin ? res.json(admin) : res.status(401).json({ error: "Não autenticado." });
});
app.get("/api/admin/dashboard", auth, (_req, res) =>
  res.json({
    products: db.prepare("SELECT COUNT(*) n FROM products").get().n,
    available: db
      .prepare("SELECT COUNT(*) n FROM products WHERE available=1")
      .get().n,
    unavailable: db
      .prepare("SELECT COUNT(*) n FROM products WHERE available=0")
      .get().n,
    categories: db
      .prepare("SELECT COUNT(*) n FROM categories WHERE active=1")
      .get().n,
    featured: db
      .prepare("SELECT COUNT(*) n FROM products WHERE featured=1")
      .get().n,
  }),
);
app.get("/api/admin/all", auth, (_req, res) =>
  res.json({
    ...publicCatalog(),
    categories: db
      .prepare(
        "SELECT c.*,(SELECT COUNT(*) FROM products p WHERE p.category_id=c.id) product_count FROM categories c ORDER BY sort_order,name",
      )
      .all(),
    products: db
      .prepare(
        "SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id ORDER BY p.sort_order,p.name",
      )
      .all(),
    groups: db
      .prepare("SELECT * FROM option_groups ORDER BY id DESC")
      .all()
      .map((g) => ({
        ...g,
        items: db
          .prepare("SELECT * FROM option_items WHERE group_id=?")
          .all(g.id),
        product_ids: db
          .prepare(
            "SELECT product_id FROM product_option_groups WHERE group_id=?",
          )
          .all(g.id)
          .map((x) => x.product_id),
      })),
    settings: settingsObject(),
  }),
);
app.post("/api/admin/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ error: "Envie JPG, PNG ou WebP de até 5 MB." });
  const buffer = fs.readFileSync(req.file.path);
  const type = inspectImage(buffer);
  if (!type) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: "O conteúdo do arquivo não é uma imagem JPG, PNG ou WebP válida.",
    });
  }
  const safePath = `${req.file.path.replace(/\.[^.]+$/, "")}.${type.extension}`;
  if (safePath !== req.file.path) fs.renameSync(req.file.path, safePath);
  return res.json({ url: `/uploads/${path.basename(safePath)}` });
});
app.post("/api/admin/categories", auth, (req, res) => {
  const validationError = validateCategoryPayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  const r = db
    .prepare(
      "INSERT INTO categories (name,image_url,sort_order,active) VALUES (?,?,?,?)",
    )
    .run(
      req.body.name,
      req.body.image_url || "",
      Number(req.body.sort_order || 0),
      bool(req.body.active),
    );
  res.json({ id: Number(r.lastInsertRowid) });
});
app.put("/api/admin/categories/:id", auth, (req, res) => {
  const validationError = validateCategoryPayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });
  db.prepare(
    "UPDATE categories SET name=?,image_url=?,sort_order=?,active=? WHERE id=?",
  ).run(
    req.body.name,
    req.body.image_url || "",
    Number(req.body.sort_order || 0),
    bool(req.body.active),
    req.params.id,
  );
  res.json({ ok: true });
});
app.delete("/api/admin/categories/:id", auth, (req, res) => {
  const count = db
    .prepare("SELECT COUNT(*) n FROM products WHERE category_id=?")
    .get(req.params.id).n;
  if (count)
    return res.status(409).json({
      error: `Esta categoria contém ${count} produto(s). Transfira-os antes de excluir.`,
    });
  db.prepare("DELETE FROM categories WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});
app.post("/api/admin/products", auth, (req, res) => {
  const b = req.body;
  const validationError = validateProductPayload(b);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!db.prepare("SELECT 1 FROM categories WHERE id=?").get(b.category_id))
    return res.status(400).json({ error: "Categoria não encontrada." });
  const r = db
    .prepare(
      `INSERT INTO products (name,description,ingredients,price,promo_price,category_id,image_url,featured,available,visible,sort_order,demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
    )
    .run(
      b.name,
      b.description || "",
      b.ingredients || "",
      Number(b.price),
      b.promo_price ? Number(b.promo_price) : null,
      Number(b.category_id),
      b.image_url || "",
      bool(b.featured),
      bool(b.available),
      bool(b.visible),
      Number(b.sort_order || 0),
    );
  res.json({ id: Number(r.lastInsertRowid) });
});
app.put("/api/admin/products/:id", auth, (req, res) => {
  const b = req.body;
  const validationError = validateProductPayload(b);
  if (validationError) return res.status(400).json({ error: validationError });
  if (!db.prepare("SELECT 1 FROM categories WHERE id=?").get(b.category_id))
    return res.status(400).json({ error: "Categoria não encontrada." });
  db.prepare(
    `UPDATE products SET name=?,description=?,ingredients=?,price=?,promo_price=?,category_id=?,image_url=?,featured=?,available=?,visible=?,sort_order=?,demo=0,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  ).run(
    b.name,
    b.description || "",
    b.ingredients || "",
    Number(b.price),
    b.promo_price ? Number(b.promo_price) : null,
    Number(b.category_id),
    b.image_url || "",
    bool(b.featureed || b.featured),
    bool(b.available),
    bool(b.visible),
    Number(b.sort_order || 0),
    req.params.id,
  );
  res.json({ ok: true });
});
app.post("/api/admin/products/:id/duplicate", auth, (req, res) => {
  const p = db.prepare("SELECT * FROM products WHERE id=?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Produto não encontrado." });
  const r = db
    .prepare(
      `INSERT INTO products (name,description,ingredients,price,promo_price,category_id,image_url,featured,available,visible,sort_order,demo) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
    )
    .run(
      `${p.name} (cópia)`,
      p.description,
      p.ingredients,
      p.price,
      p.promo_price,
      p.category_id,
      p.image_url,
      0,
      p.available,
      0,
      p.sort_order + 1,
    );
  res.json({ id: Number(r.lastInsertRowid) });
});
app.delete("/api/admin/products/:id", auth, (req, res) => {
  db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});
app.post("/api/admin/groups", auth, (req, res) => {
  const b = req.body;
  const validationError = validateGroupPayload(b);
  if (validationError) return res.status(400).json({ error: validationError });
  const tx = db.transaction(() => {
    const r = db
      .prepare(
        "INSERT INTO option_groups (name,selection_type,required,min_choices,max_choices,active) VALUES (?,?,?,?,?,?)",
      )
      .run(
        b.name,
        b.selection_type,
        bool(b.required),
        Number(b.min_choices || 0),
        Number(b.max_choices || 1),
        bool(b.active),
      );
    const id = Number(r.lastInsertRowid);
    syncGroupRelations(id, b);
    return id;
  });
  res.json({ id: tx() });
});
app.put("/api/admin/groups/:id", auth, (req, res) => {
  const b = req.body;
  const validationError = validateGroupPayload(b);
  if (validationError) return res.status(400).json({ error: validationError });
  db.transaction(() => {
    db.prepare(
      "UPDATE option_groups SET name=?,selection_type=?,required=?,min_choices=?,max_choices=?,active=? WHERE id=?",
    ).run(
      b.name,
      b.selection_type,
      bool(b.required),
      Number(b.min_choices || 0),
      Number(b.max_choices || 1),
      bool(b.active),
      req.params.id,
    );
    syncGroupRelations(Number(req.params.id), b);
  })();
  res.json({ ok: true });
});
app.delete("/api/admin/groups/:id", auth, (req, res) => {
  db.prepare("DELETE FROM option_groups WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});
app.put("/api/admin/settings", auth, (req, res) => {
  const { section, values } = req.body;
  const validationError = validateSettings(section, values);
  if (validationError) return res.status(400).json({ error: validationError });
  const stmt = db.prepare(
    "INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  );
  db.transaction(() =>
    Object.entries(values).forEach(([k, v]) => stmt.run(k, String(v ?? ""))),
  )();
  res.json({ ok: true });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(root, "dist")));
  app.use((_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
}
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({
    error:
      err.code === "LIMIT_FILE_SIZE"
        ? "Imagem acima de 5 MB."
        : "Não foi possível concluir a operação.",
  });
});
app.listen(port, () =>
  console.log(`Encantos Burger API em http://localhost:${port}`),
);
