import * as z from "zod";
import prisma from "../lib/prisma.js";
import { createCategorySchema } from "../utils/validationSchema.js";

// GET ALL CATEGORY
export const getAllCategory = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "List of all categories.",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // 5. Tangani Error Lainnya
    console.error(error);
    res.status(500).json({
      message: "Internal server error during category creation.",
    });
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const validateData = createCategorySchema.parse(req.body);

    const exist = await prisma.category.findFirst({
      where: { name: validateData.name },
    });

    if (exist) {
      return res.status(400).json({
        message: "Category already exist.",
      });
    }

    const newCategory = await prisma.category.create({
      data: validateData,
    });

    res.status(200).json({
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // 5. Tangani Error Lainnya
    console.error(error);
    res.status(500).json({
      message: "Internal server error during category creation.",
    });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const validateData = createCategorySchema.parse(req.body);

    const exist = await prisma.category.findUnique({
      where: { id: String(id) },
    });

    if (!exist) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: String(id) },
      data: validateData,
    });

    res.status(200).json({
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // 5. Tangani Error Lainnya
    console.error(error);
    res.status(500).json({
      message: "Internal server error during category creation.",
    });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const exist = await prisma.category.findUnique({
      where: { id: String(id) },
    });

    if (!exist) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    await prisma.category.delete({
      where: { id: String(id) },
    });

    res.status(200).json({
      message: "Category deleted successfully.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // 5. Tangani Error Lainnya
    console.error(error);
    res.status(500).json({
      message: "Internal server error during category creation.",
    });
  }
};
