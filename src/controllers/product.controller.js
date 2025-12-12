import * as z from "zod";
import prisma from "../lib/prisma.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../utils/validationSchema.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// Get All Product
export const getAllProduct = async (req, res) => {
  try {
    const {
      categoryId,
      search,
      minPrice,
      maxPrice,
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic filter
    const filters = {
      AND: [],
    };

    // Filter category ID
    if (categoryId) {
      filters.AND.push({
        categoryId,
      });
    }

    // Cari product berdasarakan nama
    if (search) {
      filters.AND.push({
        name: {
          contains: search,
          mode: "insensitive",
        },
      });
    }

    if (minPrice || maxPrice) {
      filters.AND.push({
        price: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      });
    }

    // Sorting
    let orderBy = { createdAt: "desc" };

    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };

    // Hitung total data sebelum pagination
    const totalItems = await prisma.product.count({
      where: filters,
    });

    // Ambil data pagination
    const products = await prisma.product.findMany({
      where: filters,
      orderBy,
      skip,
      take: limitNum,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "List of mobile phones and accessories.",
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
      },
      data: products,
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

    console.log(error);
    res.status(500).json({
      message: "Internal server error during product creation.",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product detail fetched successfully.",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error while fetching product details.",
    });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    // validasi input
    const validateData = createProductSchema.parse(req.body);

    // pastikan ada file
    if (!req.file) {
      return res.status(400).json({
        message: "Product image is required.",
      });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);

    // cek kategori
    const existCategory = await prisma.category.findUnique({
      where: { id: validateData.categoryId },
    });

    if (!existCategory) {
      return res.status(404).json({
        message: "Category not found. Product creation failed.",
      });
    }

    // simpan produk ke dalam database
    const newProduct = await prisma.product.create({
      data: {
        ...validateData,
        price: Number(validateData.price),
        stock: Number(validateData.stock),
        imageUrl: uploadResult.secure_url,
      },
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    return res.status(201).json({
      message: "Product created successfully by Admin",
      data: newProduct,
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
      message: "Internal server error during product creation.",
    });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const validateData = updateProductSchema.parse(req.body);

    const exist = await prisma.product.findUnique({
      where: { id: String(id) },
    });

    if (!exist) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    // cek kategori kalau user ingin update categoryId
    if (validateData.categoryId) {
      const existCategory = await prisma.category.findUnique({
        where: { id: validateData.categoryId },
      });

      if (!existCategory) {
        return res.status(404).json({
          message: "Category not found.",
        });
      }
    }

    let imageUrl = exist.imageUrl;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: String(id) },
      data: {
        ...validateData,
        price: validateData.price ? Number(validateData.price) : undefined,
        stock: validateData.stock ? Number(validateData.stock) : undefined,
        imageUrl,
      },
    });

    return res.status(200).json({
      message: "Product updated succesfully.",
      data: updatedProduct,
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
      message: "Internal server error during product creation.",
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const exist = await prisma.product.findUnique({
      where: { id: String(id) },
    });

    if (!exist) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    await prisma.product.delete({
      where: { id: String(id) },
    });

    return res.status(200).json({
      message: "Product deleted successfully.",
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
      message: "Internal server error during product creation.",
    });
  }
};
