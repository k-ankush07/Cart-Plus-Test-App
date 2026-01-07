import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cartItem from './routes/cartItem.js';
import fileUpload from './routes/fileUpload.js';
import discount from './routes/discount.js';

const app = express();
const port = 8001;

app.use(express.json());
app.use(cors({ origin: "*", methods: "GET,POST" }));
app.use(cartItem);
app.use(fileUpload);
app.use(discount);

mongoose
  .connect(
    "mongodb+srv://info_db_user:p2EoyFZmwgcI2MH8@cart-drawer-0.relqgzj.mongodb.net/CartDrawer?appName=Cart-Drawer-0"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));