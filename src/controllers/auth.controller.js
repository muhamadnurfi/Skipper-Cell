import bcrypt from "bcryptjs";
import * as z from "zod";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import {
  RegisterSchema,
  LoginSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../utils/validationSchema.js";

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
      return res.status(409).json({
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
          path: issue.path.join("."),
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
      { expiresIn: JWT_EXPIRES_IN },
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
          path: issue.path.join("."),
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
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      message: "User detail fetched successfully.",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch user detail.",
    });
  }
};

export const UpdateProfile = async (req, res) => {
  try {
    const validated = updateProfileSchema.parse(req.body);

    if (validated.email) {
      const existingEmail = await prisma.user.findUnique({
        where: {
          email: validated.email,
        },
      });

      if (existingEmail && existingEmail.id !== req.user.id) {
        return res.status(409).json({
          message: "Email already registered by another user.",
        });
      }
    }

    const updateUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        ...(validated.fullName !== undefined && {
          fullName: validated.fullName,
        }),
        ...(validated.email !== undefined && {
          email: validated.email,
        }),
        ...(validated.phoneNumber !== undefined && {
          phoneNumber: validated.phoneNumber,
        }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully.",
      data: updateUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid profile data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    console.error(error);
    res.status(500).json({
      message: "Failed to update profile.",
    });
  }
};

export const ChangePassword = async (req, res) => {
  try {
    const validated = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // verifikasi password yang lama
    const isCurrentPasswordValid = await bcrypt.compare(
      validated.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    // cek password lama sama dengan password baru
    const isSamePassword = await bcrypt.compare(
      validated.newPassword,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    // hash password baru
    const hashedNewPassword = await bcrypt.hash(validated.newPassword, 10);

    // update password baru ke dalam database
    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid password data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to change password.",
    });
  }
};
