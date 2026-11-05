import { query } from "../../../backend/db.js";

export const STATUSES = ["pending", "approved", "in_progress", "done", "rejected"];

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ───────────────────────────── DB (PostgreSQL) ───────────────────────────── */

const statusList = STATUSES.map((s) => `'${s}'`).join(", ");

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS feature_board (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) <= 5000),
  "imageUrl" TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (${statusList})),
  shop TEXT NOT NULL,
  "shopName" TEXT NOT NULL DEFAULT '',
  "statusUpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  votes INTEGER NOT NULL DEFAULT 0,
  voters TEXT[] NOT NULL DEFAULT '{}',
  "commentsCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feature_board_status_votes_idx ON feature_board (status, votes DESC);

CREATE TABLE IF NOT EXISTS feature_board_comments (
  "_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "featureId" UUID NOT NULL REFERENCES feature_board ("_id") ON DELETE CASCADE,
  shop TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL CHECK (char_length(body) <= 2000),
  "imageUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feature_board_comments_feature_idx
  ON feature_board_comments ("featureId", "createdAt");
`;

let connecting = null;
// Kept as `connectDB` so the route doesn't need to change; creates tables once.
export function connectDB() {
  if (!connecting) {
    connecting = query(SCHEMA_SQL).catch((e) => {
      connecting = null;
      throw e;
    });
  }
  return connecting;
}

/* ───────────────────────────── Helpers ───────────────────────────── */

export function isAppOwner(shopDomain) {
  const owners = (process.env.APP_OWNER_SHOPS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!shopDomain && owners.includes(shopDomain.toLowerCase());
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const assertId = (id) => {
  if (typeof id !== "string" || !UUID_RE.test(id)) {
    throw new HttpError("Invalid feature id", 400);
  }
};

const assertFeature = async (id) => {
  assertId(id);
  const { rowCount } = await query(
    `SELECT 1 FROM feature_board WHERE "_id" = $1`,
    [id],
  );
  if (!rowCount) throw new HttpError("Feature not found", 404);
};

const safeUrl = (u) => (typeof u === "string" && /^https?:\/\//i.test(u) ? u : null);

const toFeature = (f, shop) => ({
  id: String(f._id),
  title: f.title,
  description: f.description,
  imageUrl: f.imageUrl,
  status: f.status,
  votes: f.votes,
  commentsCount: f.commentsCount,
  shopName: f.shopName,
  hasVoted: (f.voters || []).includes(shop),
  createdAt: f.createdAt.toISOString(),
  updatedAt: (f.statusUpdatedAt || f.updatedAt).toISOString(),
});

const toComment = (c) => ({
  id: String(c._id),
  authorName: c.authorName,
  isOwner: c.isOwner,
  body: c.body,
  imageUrl: c.imageUrl,
  createdAt: c.createdAt.toISOString(),
});

/* ───────────────────────────── Logic ───────────────────────────── */

export async function getBoard(shop) {
  const { rows } = await query(
    `SELECT "_id", title, description, "imageUrl", status, votes, "commentsCount",
            "shopName", voters, "createdAt", "updatedAt", "statusUpdatedAt"
       FROM feature_board
      ORDER BY "createdAt" DESC`,
  );
  return rows.map((f) => toFeature(f, shop));
}

export async function createFeature({ shop, shopName, title, description, imageUrl }) {
  if (!title?.trim() || !description?.trim()) {
    throw new HttpError("Title and description are required");
  }
  const { rows } = await query(
    `INSERT INTO feature_board (title, description, "imageUrl", status, shop, "shopName", votes, voters)
     VALUES ($1, $2, $3, 'pending', $4, $5, 1, ARRAY[$4]::text[])
     RETURNING "_id"`,
    [
      title.trim().slice(0, 120),
      description.trim().slice(0, 5000),
      safeUrl(imageUrl),
      shop,
      shopName || "",
    ],
  );
  return rows[0]._id;
}

export async function voteFeature(shop, featureId) {
  await assertFeature(featureId);
  const res = await query(
    `UPDATE feature_board
        SET voters = array_append(voters, $2), votes = votes + 1, "updatedAt" = now()
      WHERE "_id" = $1 AND NOT ($2 = ANY(voters))`,
    [featureId, shop],
  );
  if (!res.rowCount) {
    throw new HttpError("You have already voted on this suggestion", 409);
  }
}

export async function setStatus(shop, featureId, status) {
  if (!isAppOwner(shop)) throw new HttpError("Only the app owner can change the status", 403);
  if (!STATUSES.includes(status)) throw new HttpError("Invalid status");
  assertId(featureId);
  const res = await query(
    `UPDATE feature_board
        SET status = $2, "statusUpdatedAt" = now(), "updatedAt" = now()
      WHERE "_id" = $1`,
    [featureId, status],
  );
  if (!res.rowCount) throw new HttpError("Feature not found", 404);
}

export async function listComments(featureId) {
  await assertFeature(featureId);
  const { rows } = await query(
    `SELECT "_id", "authorName", "isOwner", body, "imageUrl", "createdAt"
       FROM feature_board_comments
      WHERE "featureId" = $1
      ORDER BY "createdAt" ASC`,
    [featureId],
  );
  return { comments: rows.map(toComment) };
}

export async function addComment({ shop, shopName, featureId, body, imageUrl }) {
  if (!body?.trim()) throw new HttpError("Comment cannot be empty");
  await assertFeature(featureId);
  const owner = isAppOwner(shop);

  await query(
    `WITH ins AS (
       INSERT INTO feature_board_comments ("featureId", shop, "isOwner", "authorName", body, "imageUrl")
       VALUES ($1, $2, $3, $4, $5, $6)
     )
     UPDATE feature_board
        SET "commentsCount" = "commentsCount" + 1, "updatedAt" = now()
      WHERE "_id" = $1`,
    [
      featureId,
      shop,
      owner,
      owner ? "Rapid Cart Team" : shopName || shop,
      body.trim().slice(0, 2000),
      safeUrl(imageUrl),
    ],
  );
  return listComments(featureId);
}
