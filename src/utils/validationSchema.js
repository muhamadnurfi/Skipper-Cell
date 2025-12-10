import * as z from "zod";

export const RegisterSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name must be between 3 and 50 characters long."),
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phoneNumber: z
    .string()
    .regex(/^[0-9]+$/, "Phone number must contain only digits.")
    .min(10, "Phone number must be at least 10 digits."),
});

export const LoginSchema = z.object({
  email: z.email({ message: "Invalid format email" }),
  password: z.string().min(1, "Password is required"),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 5 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .optional(),
  price: z.number().positive("Price must be a positive number."),
  stock: z.number().int().min(0, "Stock cannot be negative."),
  imageUrl: z.url("Image URL must be a valid URL.").optional(),
  categoryId: z.uuid("Category ID must be a valid UUID string."), // ID Kategori harus diisi
});
