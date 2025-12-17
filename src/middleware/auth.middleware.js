import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const AuthenticateToken = async (req, res, next) => {
  const JWTSECRET = process.env.JWT_SECRET;

  // Gunakan nama standar: authHeader
  const authHeader = req.headers.authorization; // 1. Cek keberadaan token

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  } // 2. Ambil token (hapus "Bearer ")

  const token = authHeader.substring(7);

  try {
    // verifikasi token
    const decoded = jwt.verify(token, JWTSECRET);

    const currentUser = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    // simpan data user di objek request
    req.user = {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber,
      role: currentUser.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expire token.",
    });
  }
};

export const AuthorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      res.status(401).json({
        message: "Authentication required. ",
      });
    }
    // Cek apakah role user ada dalam array roles yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access forbidden. Insufficient privileges.",
      });
    }

    // Jika role diizinkan, lanjut
    next();
  };
};
