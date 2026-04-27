import { InvalidTokenError } from "../utils/tokenHelper.js";

// ─── Global Express Error Handler ─────────────────────────────────────────────
//
// Register this AFTER all routes in your Express app:
//
//   import { errorHandler } from "./middleware/errorHandler.js";
//   app.use(errorHandler);
//
// All route handlers should call next(err) instead of res.json on unexpected errors.

/**
 * @param {Error} err
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  // ── Auth / token errors ──────────────────────────────────────────────────
  if (err instanceof InvalidTokenError) {
    console.error(
      `[ErrorHandler] Invalid/revoked token for shop: ${err.shop}. Merchant must re-authenticate.`
    );
    return res.status(401).json({
      error: "INVALID_TOKEN",
      message:
        "Your shop's access token is invalid or has been revoked. Please re-install the app.",
      shop: err.shop,
      // Frontend can redirect to this URL to restart OAuth
      reAuthUrl: `https://${err.shop}/admin/oauth/authorize`,
    });
  }

  // ── Validation errors (optional — extend as needed) ───────────────────────
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: err.message,
    });
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  console.error("[ErrorHandler] Unhandled error:", err);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later.",
  });
}