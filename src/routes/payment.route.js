import express from "express";
import {
  AuthenticateToken,
  AuthorizeRole,
} from "../middleware/auth.middleware.js";
import { Role } from "../generated/prisma/index.js";
import {
  uploadPaymentProof,
  verifyPayment,
} from "../controllers/payOrder.controller.js";
import upload from "../middleware/upload.middleware.js";

const paymentRouter = express.Router();

// admin
paymentRouter.get("/", AuthenticateToken, AuthorizeRole([Role.ADMIN]));
paymentRouter.patch(
  "/:id/verify",
  AuthenticateToken,
  AuthorizeRole([Role.ADMIN]),
  verifyPayment
);

// user
paymentRouter.post(
  "/:id/proof",
  AuthenticateToken,
  upload.single("image"),
  uploadPaymentProof
);

export default paymentRouter;
