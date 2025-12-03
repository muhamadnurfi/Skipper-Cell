import express from "express";
import {
  createProduct,
  getAllProduct,
} from "../controllers/product.controller.js";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import { Role } from "../generated/prisma/index.js";

const productRouter = express.Router();

// Route publik
productRouter.get("/", getAllProduct);

// Route terlindungi
productRouter.post(
  "/",
  AuthenticateToken, //verifikasi jwt
  AuthorizeRole([Role.ADMIN]), // verifikasi role harus admin
  createProduct
);

export default productRouter;
