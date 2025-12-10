import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  updateProduct,
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
  AuthenticateToken, //verifikasi jwt (wajib login)
  AuthorizeRole([Role.ADMIN]), // verifikasi role harus admin
  createProduct
);

productRouter.put(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  updateProduct
);

productRouter.delete(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  deleteProduct
);

export default productRouter;
