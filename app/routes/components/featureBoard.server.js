import mongoose from "mongoose";

export const STATUSES = ["pending", "approved", "in_progress", "done", "rejected"];

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ───────────────────────────── DB connection ───────────────────────────── */

let connecting = null;
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .catch((e) => {
        connecting = null;
        throw e;
      });
  }
  return connecting;
}

/* ───────────────────────────── Model ───────────────────────────── */

const commentSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true },
    authorName: { type: String, required: true },
    isOwner: { type: Boolean, default: false },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true },
);

const featureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    imageUrl: { type: String, default: null },
    status: { type: String, enum: STATUSES, default: "pending" },
    shop: { type: String, required: true },
    shopName: { type: String, default: "" },
    statusUpdatedAt: { type: Date, default: Date.now },

    votes: { type: Number, default: 0 },
    voters: { type: [String], default: [] },

    commentsCount: { type: Number, default: 0 },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true },
);
featureSchema.index({ status: 1, votes: -1 });

export const featureModel =
  mongoose.models["FeatureBoardItem"] ||
  mongoose.model("FeatureBoardItem", featureSchema, "feature_board");

/* ───────────────────────────── Helpers ───────────────────────────── */

export function isAppOwner(shopDomain) {
  const owners = (process.env.APP_OWNER_SHOPS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!shopDomain && owners.includes(shopDomain.toLowerCase());
}

const assertId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError("Invalid feature id", 400);
};

const assertFeature = async (id) => {
  assertId(id);
  const f = await featureModel.findById(id).select("_id").lean();
  if (!f) throw new HttpError("Feature not found", 404);
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
  const features = await featureModel
    .find()
    .select("-comments")
    .sort({ createdAt: -1 })
    .lean();
  return features.map((f) => toFeature(f, shop));
}

export async function createFeature({ shop, shopName, title, description, imageUrl }) {
  if (!title?.trim() || !description?.trim()) {
    throw new HttpError("Title and description are required");
  }
  const feature = await featureModel.create({
    title: title.trim().slice(0, 120),
    description: description.trim().slice(0, 5000),
    imageUrl: safeUrl(imageUrl),
    status: "pending",
    shop,
    shopName,
    votes: 1,
    voters: [shop], 
  });
  return feature._id;
}

export async function voteFeature(shop, featureId) {
  await assertFeature(featureId);
  const res = await featureModel.updateOne(
    { _id: featureId, voters: { $ne: shop } },
    { $addToSet: { voters: shop }, $inc: { votes: 1 } },
  );
  if (!res.matchedCount) {
    throw new HttpError("You have already voted on this suggestion", 409);
  }
}

export async function setStatus(shop, featureId, status) {
  if (!isAppOwner(shop)) throw new HttpError("Only the app owner can change the status", 403);
  if (!STATUSES.includes(status)) throw new HttpError("Invalid status");
  assertId(featureId);
  const res = await featureModel.updateOne(
    { _id: featureId },
    { status, statusUpdatedAt: new Date() },
  );
  if (!res.matchedCount) throw new HttpError("Feature not found", 404);
}

export async function listComments(featureId) {
  assertId(featureId);
  const f = await featureModel.findById(featureId).select("comments").lean();
  if (!f) throw new HttpError("Feature not found", 404);
  return { comments: (f.comments || []).map(toComment) };
}

export async function addComment({ shop, shopName, featureId, body, imageUrl }) {
  if (!body?.trim()) throw new HttpError("Comment cannot be empty");
  await assertFeature(featureId);
  const owner = isAppOwner(shop);

  await featureModel.updateOne(
    { _id: featureId },
    {
      $push: {
        comments: {
          shop,
          isOwner: owner,
          authorName: owner ? "Rapid Cart Team" : shopName || shop,
          body: body.trim().slice(0, 2000),
          imageUrl: safeUrl(imageUrl),
        },
      },
      $inc: { commentsCount: 1 },
    },
  );
  return listComments(featureId);
}