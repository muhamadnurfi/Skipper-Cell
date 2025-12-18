import express from "express";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import {
  createOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { Role } from "../generated/prisma/index.js";

const orderRouter = express.Router();

// Admin
orderRouter.patch(
  "/:id/status",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  updateOrderStatus
);

// User
orderRouter.post("/", AuthenticateToken, createOrder);

export default orderRouter;
