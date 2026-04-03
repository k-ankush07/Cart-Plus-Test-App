import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cartItem from "./routes/cartItem.js";
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
app.use("/api", fileUpload);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB connection error:", err));

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`),
);
