import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cartItem from "./routes/cartItem.js";
import shopifyApi from "./routes/shopifyApi.js";
import fileUpload from "./routes/fileUpload.js";
import { requireApiKey } from "./middleware/auth.js";

dotenv.config();

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

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      const collections = await mongoose.connection.db
        .listCollections({ name: "cartordercounts" })
        .toArray();

      if (collections.length) {
        const coll = mongoose.connection.collection("cartordercounts");
        const indexes = await coll.indexes();

        const stale = indexes.find((i) => i.name === "shop_1_cartId_1");

        if (stale) {
          await coll.dropIndex("shop_1_cartId_1");
          console.log("Dropped stale index");
        }
      }
    } catch (err) {
      console.error(err.message);
    }
  })
  .catch((err) => console.error(" MongoDB connection error:", err));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`),
);
