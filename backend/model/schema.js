// PostgreSQL

import { query, CART_SETTING_FIELDS } from "../db.js";
export { query };

// ─── Generic helpers ─────────────────────────────────────────────────────────

const JSON_COLS = {
  carts: CART_SETTING_FIELDS,
  analytics: ["meta"],
  order_revenue: ["items"],
};

const q = (c) => `"${c}"`;

const prep = (table, data) => {
  const out = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined),
  );
  for (const c of JSON_COLS[table] || []) {
    if (!(c in out)) continue;
    if (out[c] === null) delete out[c];
    else out[c] = JSON.stringify(out[c]);
  }
  return out;
};

const one = async (text, params) => (await query(text, params)).rows[0] || null;
const many = async (text, params) => (await query(text, params)).rows;

const insert = async (table, data) => {
  const d = prep(table, data);
  const cols = Object.keys(d);
  if (!cols.length) return one(`INSERT INTO ${table} DEFAULT VALUES RETURNING *`);
  return one(
    `INSERT INTO ${table} (${cols.map(q).join(",")})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`,
    cols.map((c) => d[c]),
  );
};

const update = async (table, whereCol, whereVal, data, touch = true) => {
  const d = prep(table, data);
  if (touch) d.updatedAt = new Date();
  const cols = Object.keys(d);
  return one(
    `UPDATE ${table} SET ${cols.map((c, i) => `${q(c)} = $${i + 1}`).join(", ")}
     WHERE ${q(whereCol)} = $${cols.length + 1} RETURNING *`,
    [...cols.map((c) => d[c]), whereVal],
  );
};

// INSERT ... ON CONFLICT DO UPDATE. insertOnly = sirf insert pe set hone wale columns.
const upsert = async (table, conflict, data, { insertOnly = [] } = {}) => {
  const d = prep(table, data);
  const cols = Object.keys(d);
  const upd = cols.filter(
    (c) => !conflict.includes(c) && !insertOnly.includes(c),
  );
  const setSql = upd.length
    ? upd.map((c) => `${q(c)} = EXCLUDED.${q(c)}`).join(", ")
    : `${q(conflict[0])} = EXCLUDED.${q(conflict[0])}`;
  return one(
    `INSERT INTO ${table} (${cols.map(q).join(",")})
     VALUES (${cols.map((_, i) => `$${i + 1}`).join(",")})
     ON CONFLICT (${conflict.map(q).join(",")}) DO UPDATE SET ${setSql}
     RETURNING *`,
    cols.map((c) => d[c]),
  );
};

// ─── carts ───────────────────────────────────────────────────────────────────
export const cartModels = {
  findByShop: (shop) =>
    many(`SELECT * FROM carts WHERE shop = $1 ORDER BY "createdAt" ASC`, [shop]),
  findByCartId: (cartId) =>
    one(`SELECT * FROM carts WHERE "cartId" = $1`, [cartId]),
  findPublishedByShop: (shop) =>
    one(`SELECT * FROM carts WHERE shop = $1 AND status = 'published' LIMIT 1`, [
      shop,
    ]),
  countByShop: async (shop) =>
    (await one(`SELECT COUNT(*)::int AS n FROM carts WHERE shop = $1`, [shop]))
      .n,
  findAnyByShop: (shop) =>
    one(`SELECT * FROM carts WHERE shop = $1 LIMIT 1`, [shop]),
  create: (data) => insert("carts", data),
  update: (cartId, data) => update("carts", "cartId", cartId, data),
  deleteByCartId: (cartId) =>
    one(`DELETE FROM carts WHERE "cartId" = $1 RETURNING *`, [cartId]),
  unpublishAllInShop: (shop) =>
    query(
      `UPDATE carts SET status = 'unpublished', "updatedAt" = now()
       WHERE shop = $1 AND status = 'published'`,
      [shop],
    ),
};

// ─── sticky_carts ────────────────────────────────────────────────────────────
export const stickyCartModel = {
  findByShop: (shop) =>
    one(`SELECT * FROM sticky_carts WHERE shop = $1`, [shop]),
  // cartId sirf pehli baar (insert) pe set hota hai
  upsertByShop: (data) =>
    upsert("sticky_carts", ["shop"], data, { insertOnly: ["cartId"] }),
};

// ─── shop_configs ────────────────────────────────────────────────────────────
export const shopConfigModel = {
  findByShop: (shop) =>
    one(`SELECT * FROM shop_configs WHERE shop = $1`, [shop]),
  upsertByShop: (data) => upsert("shop_configs", ["shop"], data),
};

// ─── plans ───────────────────────────────────────────────────────────────────
export const shopPlanModel = {
  findByShop: (shop) => one(`SELECT * FROM plans WHERE shop = $1`, [shop]),
  upsertByShop: (data) => upsert("plans", ["shop"], data),
  create: (data) => insert("plans", data),
  deleteByShop: (shop) => query(`DELETE FROM plans WHERE shop = $1`, [shop]),
};

// ─── analytics ───────────────────────────────────────────────────────────────
export const analyticsModel = {
  impressionExists: async ({ shop, sessionId, cartId, variantId }) => {
    const params = [shop, sessionId, cartId || null];
    let sql = `SELECT 1 FROM analytics
      WHERE shop = $1 AND "sessionId" = $2
        AND "cartId" IS NOT DISTINCT FROM $3::text
        AND "eventType" = 'cart_impression'`;
    if (variantId) {
      params.push(variantId);
      sql += ` AND meta->>'variantId' = $4`;
    }
    return !!(await one(sql + " LIMIT 1", params));
  },
  create: (data) => insert("analytics", data),
};

// ─── order_revenue ───────────────────────────────────────────────────────────
export const orderRevenueModel = {
  existsByOrderId: async (orderId) =>
    !!(await one(`SELECT 1 FROM order_revenue WHERE "orderId" = $1`, [orderId])),
  upsertByOrderId: (data) => upsert("order_revenue", ["orderId"], data),
};

// ─── cart_order_counts ───────────────────────────────────────────────────────
export const cartOrderCountModel = {
  increment: (shop, cartId, date) =>
    query(
      `INSERT INTO cart_order_counts (shop, "cartId", "date", "totalOrders")
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (shop, "cartId", "date")
       DO UPDATE SET "totalOrders" = cart_order_counts."totalOrders" + 1,
                     "updatedAt" = now()`,
      [shop, cartId, date],
    ),
  monthTotal: async (shop, monthStart, monthEnd) =>
    (
      await one(
        `SELECT COALESCE(SUM("totalOrders"), 0)::int AS total
         FROM cart_order_counts
         WHERE shop = $1 AND "date" >= $2 AND "date" < $3`,
        [shop, monthStart, monthEnd],
      )
    ).total,
  find: (shop, cartId) =>
    many(
      `SELECT * FROM cart_order_counts WHERE shop = $1
       ${cartId ? `AND "cartId" = $2` : ""} ORDER BY "date" DESC`,
      cartId ? [shop, cartId] : [shop],
    ),
};

// ─── contacts ────────────────────────────────────────────────────────────────
export const contactModel = {
  create: (data) => insert("contacts", data),
};

// ─── cart_activity ───────────────────────────────────────────────────────────

const ACTIVITY_DEFAULTS = {
  cartId: null,
  cartToken: null,
  pageTitle: "",
  url: "",
  quantity: 1,
  productTitle: "",
  variantTitle: "",
  productId: null,
  variantId: null,
  handle: "",
  image: "",
  price: 0,
  customerId: null,
  timezone: "",
  userAgent: "",
  currency: "",
  createdAt: new Date(),
};

const ACTIVITY_COLS = [
  "shop",
  "cartId",
  "sessionId",
  "cartToken",
  "action",
  "pageTitle",
  "url",
  "quantity",
  "productTitle",
  "variantTitle",
  "productId",
  "variantId",
  "handle",
  "image",
  "price",
  "customerId",
  "timezone",
  "userAgent",
  "currency",
  "createdAt",
];

export const cartActivityModel = {
  insertMany: async (docs) => {
    if (!docs?.length) return;

    const params = [];

    const tuples = docs.map((doc) => {
      const ph = ACTIVITY_COLS.map((c) => {
        const value = doc[c] ?? ACTIVITY_DEFAULTS[c] ?? null;
        params.push(value);
        return `$${params.length}`;
      });

      return `(${ph.join(",")})`;
    });

    await query(
      `INSERT INTO cart_activity (${ACTIVITY_COLS.map(q).join(",")})
       VALUES ${tuples.join(",")}`,
      params,
    );
  },
};