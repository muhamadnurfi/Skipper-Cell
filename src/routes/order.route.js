import express from "express";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import {
  createOrder,
  getOrderDetail,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { Role } from "../generated/prisma/index.js";
import {
  getAllOrders,
  getMyOrders,
} from "../controllers/orderHistory.controller.js";

const orderRouter = express.Router();

// Admin
orderRouter.get(
  "/",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  getAllOrders
);

orderRouter.patch(
  "/:id/status",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  updateOrderStatus
);

// User
orderRouter.post("/", AuthenticateToken, createOrder);
orderRouter.get("/me", AuthenticateToken, getMyOrders);
orderRouter.get("/:id", AuthenticateToken, getOrderDetail);

export default orderRouter;
