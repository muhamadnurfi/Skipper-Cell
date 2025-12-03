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
