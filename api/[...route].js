import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";

const { Pool, types } = pg;
types.setTypeParser(20, Number);
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

const send = (res, status, body) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
};
const pathOf = (req) => {
  const parts = req.query.route;
  if (parts) return `/${Array.isArray(parts) ? parts.join("/") : parts}`;
  return new URL(req.url, "https://encantos.local").pathname.replace(
    /^\/api/,
    "",
  );
};
const asId = (value) => Number.parseInt(value, 10);
const cookieToken = (req) =>
  (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("encantos.sid="))
    ?.slice(13) || "";
const settings = async (client = pool) => {
  const { rows } = await client.query("SELECT key,value FROM settings");
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
};
const catalog = async () => {
  const [categories, products, groups, items, links, appSettings] =
    await Promise.all([
      pool.query(
        "SELECT * FROM categories WHERE active ORDER BY sort_order,name",
      ),
      pool.query(
        "SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id WHERE p.visible AND c.active ORDER BY p.sort_order,p.name",
      ),
      pool.query("SELECT * FROM option_groups WHERE active"),
      pool.query("SELECT * FROM option_items WHERE active"),
      pool.query("SELECT * FROM product_option_groups"),
      settings(),
    ]);
  for (const product of products.rows) {
    product.option_groups = links.rows
      .filter((link) => link.product_id === product.id)
      .map((link) => {
        const group = groups.rows.find((row) => row.id === link.group_id);
        return (
          group && {
            ...group,
            items: items.rows.filter((row) => row.group_id === group.id),
          }
        );
      })
      .filter(Boolean);
  }
  return {
    categories: categories.rows,
    products: products.rows,
    settings: appSettings,
  };
};
const currentAdmin = async (req) => {
  const token = cookieToken(req);
  if (!token) return null;
  const { rows } = await pool.query(
    "SELECT a.id,a.email FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token=$1 AND s.expires_at>now()",
    [decodeURIComponent(token)],
  );
  return rows[0] || null;
};
const transaction = async (task) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const replaceGroupRelations = async (client, groupId, body) => {
  await client.query("DELETE FROM option_items WHERE group_id=$1", [groupId]);
  await client.query("DELETE FROM product_option_groups WHERE group_id=$1", [
    groupId,
  ]);
  for (const item of body.items || []) {
    await client.query(
      "INSERT INTO option_items (group_id,name,price_delta,active) VALUES ($1,$2,$3,$4)",
      [groupId, item.name, Number(item.price_delta || 0), Boolean(item.active)],
    );
  }
  for (const productId of body.product_ids || []) {
    await client.query(
      "INSERT INTO product_option_groups VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [asId(productId), groupId],
    );
  }
};

export default async function handler(req, res) {
  const path = pathOf(req);
  const body = req.body || {};
  try {
    if (req.method === "GET" && path === "/catalog")
      return send(res, 200, await catalog());
    if (req.method === "POST" && path === "/cart/validate") {
      const ids = [
        ...new Set(
          (body.items || [])
            .map((item) => asId(item.productId))
            .filter(Boolean),
        ),
      ];
      if (!ids.length) return send(res, 200, { products: [] });
      const { rows } = await pool.query(
        "SELECT id,name,price,promo_price,available,visible FROM products WHERE id=ANY($1::bigint[])",
        [ids],
      );
      return send(res, 200, { products: rows });
    }
    if (req.method === "POST" && path === "/auth/login") {
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      const { rows } = await pool.query("SELECT * FROM admins WHERE email=$1", [
        email,
      ]);
      const admin = rows[0];
      if (
        !admin ||
        !(await bcrypt.compare(
          String(body.password || ""),
          admin.password_hash,
        ))
      ) {
        return send(res, 401, { error: "E-mail ou senha inválidos." });
      }
      const token = crypto.randomBytes(32).toString("base64url");
      await pool.query("DELETE FROM sessions WHERE expires_at<=now()");
      await pool.query(
        "INSERT INTO sessions VALUES ($1,$2,now()+interval '7 days')",
        [token, admin.id],
      );
      res.setHeader(
        "Set-Cookie",
        `encantos.sid=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      );
      return send(res, 200, { email: admin.email });
    }
    if (req.method === "POST" && path === "/auth/logout") {
      const token = cookieToken(req);
      if (token)
        await pool.query("DELETE FROM sessions WHERE token=$1", [
          decodeURIComponent(token),
        ]);
      res.setHeader(
        "Set-Cookie",
        "encantos.sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      );
      return send(res, 200, { ok: true });
    }
    if (req.method === "GET" && path === "/auth/me") {
      const admin = await currentAdmin(req);
      return admin
        ? send(res, 200, admin)
        : send(res, 401, { error: "Não autenticado." });
    }
    if (!path.startsWith("/admin/"))
      return send(res, 404, { error: "Rota não encontrada." });
    if (!(await currentAdmin(req)))
      return send(res, 401, { error: "Acesso administrativo necessário." });

    if (req.method === "GET" && path === "/admin/dashboard") {
      const { rows } = await pool.query(`SELECT
        (SELECT COUNT(*)::int FROM products) products,
        (SELECT COUNT(*)::int FROM products WHERE available) available,
        (SELECT COUNT(*)::int FROM products WHERE NOT available) unavailable,
        (SELECT COUNT(*)::int FROM categories WHERE active) categories,
        (SELECT COUNT(*)::int FROM products WHERE featured) featured`);
      return send(res, 200, rows[0]);
    }
    if (req.method === "GET" && path === "/admin/all") {
      const [categories, products, groups, items, links, appSettings] =
        await Promise.all([
          pool.query(
            "SELECT c.*,(SELECT COUNT(*)::int FROM products p WHERE p.category_id=c.id) product_count FROM categories c ORDER BY sort_order,name",
          ),
          pool.query(
            "SELECT p.*,c.name category_name FROM products p JOIN categories c ON c.id=p.category_id ORDER BY p.sort_order,p.name",
          ),
          pool.query("SELECT * FROM option_groups ORDER BY id DESC"),
          pool.query("SELECT * FROM option_items ORDER BY id"),
          pool.query("SELECT * FROM product_option_groups"),
          settings(),
        ]);
      return send(res, 200, {
        categories: categories.rows,
        products: products.rows,
        groups: groups.rows.map((group) => ({
          ...group,
          items: items.rows.filter((item) => item.group_id === group.id),
          product_ids: links.rows
            .filter((link) => link.group_id === group.id)
            .map((link) => link.product_id),
        })),
        settings: appSettings,
      });
    }
    if (req.method === "POST" && path === "/admin/upload") {
      return send(res, 501, {
        error:
          "O envio de arquivos ainda não está configurado. Use uma URL de imagem.",
      });
    }

    if (req.method === "POST" && path === "/admin/categories") {
      const { rows } = await pool.query(
        "INSERT INTO categories (name,image_url,sort_order,active) VALUES ($1,$2,$3,$4) RETURNING id",
        [
          body.name,
          body.image_url || "",
          Number(body.sort_order || 0),
          Boolean(body.active),
        ],
      );
      return send(res, 200, rows[0]);
    }
    const category = path.match(/^\/admin\/categories\/(\d+)$/);
    if (category && req.method === "PUT") {
      await pool.query(
        "UPDATE categories SET name=$1,image_url=$2,sort_order=$3,active=$4 WHERE id=$5",
        [
          body.name,
          body.image_url || "",
          Number(body.sort_order || 0),
          Boolean(body.active),
          asId(category[1]),
        ],
      );
      return send(res, 200, { ok: true });
    }
    if (category && req.method === "DELETE") {
      const categoryId = asId(category[1]);
      const { rows } = await pool.query(
        "SELECT COUNT(*)::int n FROM products WHERE category_id=$1",
        [categoryId],
      );
      if (rows[0].n)
        return send(res, 409, {
          error: `Esta categoria contém ${rows[0].n} produto(s). Transfira-os antes de excluir.`,
        });
      await pool.query("DELETE FROM categories WHERE id=$1", [categoryId]);
      return send(res, 200, { ok: true });
    }

    const invalidPromo = () =>
      body.promo_price && Number(body.promo_price) >= Number(body.price);
    if (req.method === "POST" && path === "/admin/products") {
      if (invalidPromo())
        return send(res, 400, {
          error: "O preço promocional deve ser menor que o preço normal.",
        });
      const { rows } = await pool.query(
        `INSERT INTO products
        (name,description,ingredients,price,promo_price,category_id,image_url,featured,available,visible,sort_order,demo)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false) RETURNING id`,
        [
          body.name,
          body.description || "",
          body.ingredients || "",
          Number(body.price),
          body.promo_price ? Number(body.promo_price) : null,
          asId(body.category_id),
          body.image_url || "",
          Boolean(body.featured),
          Boolean(body.available),
          Boolean(body.visible),
          Number(body.sort_order || 0),
        ],
      );
      return send(res, 200, rows[0]);
    }
    const duplicate = path.match(/^\/admin\/products\/(\d+)\/duplicate$/);
    if (duplicate && req.method === "POST") {
      const { rows } = await pool.query(
        `INSERT INTO products
        (name,description,ingredients,price,promo_price,category_id,image_url,featured,available,visible,sort_order,demo)
        SELECT name || ' (cópia)',description,ingredients,price,promo_price,category_id,image_url,false,available,false,sort_order+1,false FROM products WHERE id=$1 RETURNING id`,
        [asId(duplicate[1])],
      );
      return rows[0]
        ? send(res, 200, rows[0])
        : send(res, 404, { error: "Produto não encontrado." });
    }
    const product = path.match(/^\/admin\/products\/(\d+)$/);
    if (product && req.method === "PUT") {
      if (invalidPromo())
        return send(res, 400, {
          error: "O preço promocional deve ser menor que o preço normal.",
        });
      await pool.query(
        `UPDATE products SET name=$1,description=$2,ingredients=$3,price=$4,promo_price=$5,category_id=$6,
        image_url=$7,featured=$8,available=$9,visible=$10,sort_order=$11,demo=false,updated_at=now() WHERE id=$12`,
        [
          body.name,
          body.description || "",
          body.ingredients || "",
          Number(body.price),
          body.promo_price ? Number(body.promo_price) : null,
          asId(body.category_id),
          body.image_url || "",
          Boolean(body.featured),
          Boolean(body.available),
          Boolean(body.visible),
          Number(body.sort_order || 0),
          asId(product[1]),
        ],
      );
      return send(res, 200, { ok: true });
    }
    if (product && req.method === "DELETE") {
      await pool.query("DELETE FROM products WHERE id=$1", [asId(product[1])]);
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && path === "/admin/groups") {
      const groupId = await transaction(async (client) => {
        const { rows } = await client.query(
          "INSERT INTO option_groups (name,selection_type,required,min_choices,max_choices,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
          [
            body.name,
            body.selection_type,
            Boolean(body.required),
            Number(body.min_choices || 0),
            Number(body.max_choices || 1),
            Boolean(body.active),
          ],
        );
        await replaceGroupRelations(client, rows[0].id, body);
        return rows[0].id;
      });
      return send(res, 200, { id: groupId });
    }
    const group = path.match(/^\/admin\/groups\/(\d+)$/);
    if (group && req.method === "PUT") {
      await transaction(async (client) => {
        const groupId = asId(group[1]);
        await client.query(
          "UPDATE option_groups SET name=$1,selection_type=$2,required=$3,min_choices=$4,max_choices=$5,active=$6 WHERE id=$7",
          [
            body.name,
            body.selection_type,
            Boolean(body.required),
            Number(body.min_choices || 0),
            Number(body.max_choices || 1),
            Boolean(body.active),
            groupId,
          ],
        );
        await replaceGroupRelations(client, groupId, body);
      });
      return send(res, 200, { ok: true });
    }
    if (group && req.method === "DELETE") {
      await pool.query("DELETE FROM option_groups WHERE id=$1", [
        asId(group[1]),
      ]);
      return send(res, 200, { ok: true });
    }
    if (req.method === "PUT" && path === "/admin/settings") {
      await transaction(async (client) => {
        for (const [key, value] of Object.entries(body)) {
          await client.query(
            "INSERT INTO settings VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            [key, String(value ?? "")],
          );
        }
      });
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: "Rota administrativa não encontrada." });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: "Não foi possível concluir a operação." });
  }
}
