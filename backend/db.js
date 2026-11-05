import pg from "pg";

const { Pool } = pg;

// ─── Connection ──────────────────────────────────────────────────────────────
let pool;
export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/cartplus",
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
      idleTimeoutMillis: 30_000, 
      connectionTimeoutMillis: 10_000, 
      query_timeout: 15_000,
      max: 10,
    });
    pool.on("error", (err) => console.error("PG POOL ERROR:", err));
  }
  return pool;
};

export const query = (text, params) => getPool().query(text, params);

// ─── Constants ───────────────────────────────────────────────────────────────

export const CART_SETTING_FIELDS = [
  "designSettings",
  "headerSettings",
  "announcementSettings",
  "rewardsSettings",
  "recommendationsSettings",
  "subscriptionUpgradesSettings",
  "upsellsSettings",
  "additionalNotesSettings",
  "addonsSettings",
  "discountCodesSettings",
  "expressPaymentsSettings",
  "trustBadgesSettings",
  "cartSettings",
  "triggeredRewardsSettings",
];

const POSITIONS = [
  "bottom-right",
  "center-right",
  "top-right",
  "bottom-left",
  "center-left",
  "top-left",
  "right",
  "left",
  "bottom",
];

const settingsCols = CART_SETTING_FIELDS.map(
  (f) => `"${f}" JSONB NOT NULL DEFAULT '{}'::jsonb`,
).join(",\n    ");
const positionList = POSITIONS.map((p) => `'${p}'`).join(", ");

// ─── Tables ──────────────────────────────────────────────────────────────────
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS carts (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  "shopEmail" TEXT NOT NULL,
  "storeOwner" TEXT NOT NULL,
  "cartId" TEXT NOT NULL UNIQUE,
  "cartName" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpublished'
    CHECK (status IN ('unpublished','published')),
  "lastLiveDate" TIMESTAMPTZ,
  ${settingsCols},
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS carts_shop_idx ON carts (shop);

CREATE TABLE IF NOT EXISTS sticky_carts (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL UNIQUE,
  "cartId" TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  template TEXT NOT NULL DEFAULT 'bubble'
    CHECK (template IN ('bubble','pill','ring','tab','bar')),
  "position" TEXT NOT NULL DEFAULT 'bottom-right'
    CHECK ("position" IN (${positionList})),
  "mobilePosition" TEXT NOT NULL DEFAULT 'bottom-right'
    CHECK ("mobilePosition" IN (${positionList})),
  "displayOnMobile" BOOLEAN NOT NULL DEFAULT true,
  device TEXT NOT NULL DEFAULT 'all',
  "selectedIcon" TEXT NOT NULL DEFAULT 'bag',
  "customIconUrl" TEXT,
  "iconColor" TEXT NOT NULL DEFAULT '#ffffff',
  "iconSize" DOUBLE PRECISION NOT NULL DEFAULT 24
    CHECK ("iconSize" BETWEEN 16 AND 40),
  "bgColor" TEXT NOT NULL DEFAULT '#000000',
  "buttonSize" DOUBLE PRECISION NOT NULL DEFAULT 60
    CHECK ("buttonSize" BETWEEN 40 AND 100),
  "barRadius" DOUBLE PRECISION NOT NULL DEFAULT 50
    CHECK ("barRadius" BETWEEN 0 AND 50),
  "barStyle" TEXT NOT NULL DEFAULT 'floating'
    CHECK ("barStyle" IN ('floating','attached')),
  "enableCount" BOOLEAN NOT NULL DEFAULT true,
  "qBgColor" TEXT NOT NULL DEFAULT '#6d3bff',
  "qTextColor" TEXT NOT NULL DEFAULT '#ffffff',
  "hideOnEmptyCart" BOOLEAN NOT NULL DEFAULT false,
  "customCss" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_configs (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL UNIQUE,
  "accessToken" TEXT NOT NULL,
  email TEXT,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  "subscriptionId" TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','pending','cancelled')),
  "isDev" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  "cartId" TEXT,
  "eventType" TEXT NOT NULL
    CHECK ("eventType" IN ('cart_impression','checkout_initiated','checkout_completed')),
  "sessionId" TEXT NOT NULL,
  "userAgent" TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_shop_created_idx ON analytics (shop, "createdAt");
CREATE INDEX IF NOT EXISTS analytics_shop_cart_created_idx ON analytics (shop, "cartId", "createdAt");
CREATE INDEX IF NOT EXISTS analytics_shop_event_created_idx ON analytics (shop, "eventType", "createdAt");
CREATE INDEX IF NOT EXISTS analytics_shop_session_idx ON analytics (shop, "sessionId");
CREATE INDEX IF NOT EXISTS analytics_variant_idx ON analytics ((meta->>'variantId'));

CREATE TABLE IF NOT EXISTS order_revenue (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  "cartId" TEXT,
  "orderId" TEXT NOT NULL UNIQUE,
  "orderNumber" INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "baseRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "upsellRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "addonRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subscriptionRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  "variantId" TEXT,
  "variantKey" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_revenue_shop_created_idx ON order_revenue (shop, "createdAt");
CREATE INDEX IF NOT EXISTS order_revenue_shop_cart_created_idx ON order_revenue (shop, "cartId", "createdAt");
CREATE INDEX IF NOT EXISTS order_revenue_shop_cart_variant_idx ON order_revenue (shop, "cartId", "variantKey", "createdAt");

CREATE TABLE IF NOT EXISTS cart_order_counts (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop, "cartId", "date")
);

CREATE TABLE IF NOT EXISTS contacts (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_created_idx ON contacts ("createdAt" DESC);

CREATE TABLE IF NOT EXISTS cart_activity (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  "cartId" TEXT,
  "sessionId" TEXT NOT NULL,
  "cartToken" TEXT,
  action TEXT NOT NULL
    CHECK (action IN ('added','removed','product_viewed','page_viewed')),
  "pageTitle" TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  "productTitle" TEXT NOT NULL DEFAULT '',
  "variantTitle" TEXT NOT NULL DEFAULT '',
  "productId" TEXT,
  "variantId" TEXT,
  handle TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  "customerId" TEXT,
  timezone TEXT NOT NULL DEFAULT '',
  "userAgent" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cart_activity_shop_created_idx ON cart_activity (shop, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS cart_activity_shop_session_idx ON cart_activity (shop, "sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS cart_activity_created_idx ON cart_activity ("createdAt");
`;

// ─── Init (tables auto-create) ───────────────────────────────────────────────
let dbReady = null;
let cleanupTimer = null;

export const ensureDb = () => {
  if (!dbReady) {
    dbReady = (async () => {
      await query(SCHEMA_SQL);
      console.log("[db] PostgreSQL ready (tables checked/created)");

      const cleanup = () =>
        query(
          `DELETE FROM cart_activity WHERE "createdAt" < now() - interval '90 days'`,
        ).catch((e) => console.error("[db] cart_activity cleanup error:", e));
      cleanup();
      if (!cleanupTimer) {
        cleanupTimer = setInterval(cleanup, 6 * 60 * 60 * 1000);
        cleanupTimer.unref?.();
      }
    })().catch((err) => {
      dbReady = null; 
      throw err;
    });
  }
  return dbReady;
};