import mongoose from "mongoose";

let connectPromise = null;

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectPromise) {
    connectPromise = mongoose
      .connect(process.env.MONGO_URI)
      .catch((err) => {
        connectPromise = null;
        throw err;
      });
  }
  await connectPromise;
  return mongoose.connection;
}