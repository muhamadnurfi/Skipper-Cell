import express from "express";
import { AuthenticateToken } from "../middleware/auth.middleware.js";
import { createOrder } from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/", AuthenticateToken, createOrder);

export default orderRouter;
