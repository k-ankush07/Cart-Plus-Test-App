export function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (key !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  next();
}