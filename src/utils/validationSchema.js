import * as z from "zod";

// AUTH
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

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Full name must be at least 3 characters.")
      .optional(),
    email: z
      .email({ message: "Please enter a valid email address." })
      .optional(),
    phoneNumber: z
      .string()
      .regex(/^[0-9]+$/, "Phone number must contain only digits.")
      .min(10, "Phone number must be at least 10 digits.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
    path: ["fullName", "email", "phoneNumber", "password"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation password do not match.",
    path: ["confirmPassword"],
  });

// CATEGORY
export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
});

// PRODUCT
export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 5 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  imageUrl: z.url("Image URL must be a valid URL.").optional(),
  categoryId: z.uuid("Category ID must be a valid UUID string."), // ID Kategori harus diisi
});

export const updateProductSchema = createProductSchema.partial();

//CART
export const addToCartSchema = z.object({
  productId: z.uuid("Product ID must be a valid UUID string."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
});

//WISHLIST
export const addToWishlistSchema = z.object({
  productId: z.uuid("Product ID must be a valid UUID string."),
});
