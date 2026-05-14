import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cartItem from "./routes/cartItem.js";
import shopifyApi from "./routes/shopifyApi.js";
import fileUpload from "./routes/fileUpload.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 9002;

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use("/api", cartItem);
app.use("/api", shopifyApi);
app.use("/api", fileUpload);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      const coll = mongoose.connection.collection("cartordercounts");
      const indexes = await coll.indexes();
      const stale = indexes.find((i) => i.name === "shop_1_cartId_1");
      if (stale) {
        await coll.dropIndex("shop_1_cartId_1");
        console.log("Dropped stale index shop_1_cartId_1 on cartordercounts");
      }
    } catch (err) {
      console.error("Index cleanup error:", err?.message);
    }
  })
  .catch((err) => console.error(" MongoDB connection error:", err));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`),
);
