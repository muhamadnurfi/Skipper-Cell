import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import { Role } from "../generated/prisma/index.js";
import upload from "../middleware/upload.middleware.js";

const productRouter = express.Router();

// Route publik
productRouter.get("/", getAllProduct);
productRouter.get("/:id", getProductById);

// Route terlindungi
productRouter.post(
  "/",
  AuthenticateToken, //verifikasi jwt (wajib login)
  AuthorizeRole([Role.ADMIN]), // verifikasi role harus admin
  upload.single("image"),
  createProduct
);

productRouter.put(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  upload.single("image"),
  updateProduct
);

productRouter.delete(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  deleteProduct
);

export default productRouter;
