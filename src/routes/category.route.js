import express from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import { Role } from "../generated/prisma/index.js";

const categoryRouter = express.Router();

// Route Publik
categoryRouter.get("/", getAllCategory);

// Route terlindungi
categoryRouter.post(
  "/",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  createCategory
);
categoryRouter.put(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  updateCategory
);
categoryRouter.delete(
  "/:id",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  deleteCategory
);

export default categoryRouter;
