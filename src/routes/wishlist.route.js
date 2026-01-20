import express from "express";
import { AuthenticateToken } from "../middleware/auth.middleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkWishlistStatus,
} from "../controllers/wishlist.controller.js";

const wishlistRouter = express.Router();

// Get user's wishlist
wishlistRouter.get("/", AuthenticateToken, getWishlist);

// Check if product is in wishlist
wishlistRouter.get("/:productId", AuthenticateToken, checkWishlistStatus);

// Add product to wishlist
wishlistRouter.post("/:productId", AuthenticateToken, addToWishlist);

// Remove product from wishlist
wishlistRouter.delete("/:productId", AuthenticateToken, removeFromWishlist);

// Clear wishlist
wishlistRouter.delete("/", AuthenticateToken, clearWishlist);

export default wishlistRouter;
