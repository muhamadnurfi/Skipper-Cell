import express from "express";
import { AuthenticateToken } from "../middleware/auth.middleware.js";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

const cartRouter = express.Router();

cartRouter.get("/", AuthenticateToken, getCart);
cartRouter.post("/", AuthenticateToken, addToCart);
cartRouter.put("/items/:itemId", AuthenticateToken, updateCartItem);
cartRouter.delete("/items/:itemId", AuthenticateToken, removeFromCart);
cartRouter.delete("/", AuthenticateToken, clearCart);

export default cartRouter;
