import express from "express";
import { LoginUser, RegisterUser } from "../controllers/auth.controller.js";

const AuthRouter = express.Router();

AuthRouter.post("/register", RegisterUser);
AuthRouter.post("/login", LoginUser);

export default AuthRouter;
