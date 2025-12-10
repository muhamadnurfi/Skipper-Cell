import bcrypt from "bcryptjs";
import * as z from "zod";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { RegisterSchema, LoginSchema } from "../utils/validationSchema.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const RegisterUser = async (req, res) => {
  const { fullName, email, password, phoneNumber } = req.body;

  try {
    // validation zod schema
    const validated = RegisterSchema.parse(req.body);

    // Cek duplikat email dan phoneNumber
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      res.status(409).json({
        message: "Registration failed. Email is already registered.",
      });
    }

    // Enkripsi Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna baru ke database
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    res.status(201).json({
      message: "Skipper Cell Registration Successful!",
      data: {
        newUser,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid registration data.",
        errors: error.issues.map((issue) => ({
          path: path.issue.join("."),
          message: issue.message,
        })),
      });
    }
    // Error express
    console.log(error);
    res.status(500).json({
      message: "Server down",
    });
  }
};

export const LoginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation login schema
    const validated = LoginSchema.parse(req.body);

    // Cari pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    // Cek jika user tidak ditemukan
    if (!user) {
      return res.status(401).json({
        message: "Authentication failed. Invalid email or password.",
      });
    }

    // Bandingkan password (dengan hash yang tersimpan di DB)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Authentication failed. Invalid email or password.",
      });
    }

    // GENERATE JSON WEB TOKEN (JWT)
    // Payload JWT: berisi informasi yang digunakan untuk identifikasi user
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Kirim data respon
    const userData = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      message: "You are now logged in",
      token: token,
      data: userData,
    });
  } catch (error) {
    // Tangkap error dari zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid login data.",
        errors: error.issues.map((issue) => ({
          path: i.issues.join("."),
          message: issue.message,
        })),
      });
    }
    // error lainnya
    console.log(error);
    return res.status(500).json({
      message: "Internal server error during login.",
    });
  }
};

export const GetUser = async (req, res) => {
  res.status(200).json({
    message: "User retrieved successfully",
  });
};
