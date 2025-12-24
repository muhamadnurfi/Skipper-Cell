import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import AuthRouter from "./routes/auth.route.js";
import productRouter from "./routes/product.route.js";
import categoryRouter from "./routes/category.route.js";
import orderRouter from "./routes/order.route.js";
import paymentRouter from "./routes/payment.route.js";

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(helmet()); // Security headers
app.use(cors()); // Allow Cross-Origin requests
app.use(morgan("dev")); // Logger
app.use(express.json()); // Parsing body request (JSON)
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// --- ROUTES ---
app.use("/api/auth", AuthRouter);
app.use("/api/products", productRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n===================================`);
  console.log(`🚀 Skipper Cell Server running on port ${PORT}`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`===================================\n`);
});
