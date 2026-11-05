
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "dotenv/config";
dotenv.config();

import { ensureDb } from "./db.js";

import cartItem from "./routes/cartItem.js";
import shopifyApi from "./routes/shopifyApi.js";
import fileUpload from "./routes/fileUpload.js";
import { requireApiKey } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 6002;

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use("/api", requireApiKey);

app.use("/api", cartItem);
app.use("/api", shopifyApi);
app.use("/api", fileUpload);

const startServer = async () => {
  try {
    await ensureDb();

    console.log("PostgreSQL connected successfully");

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
};

startServer();
