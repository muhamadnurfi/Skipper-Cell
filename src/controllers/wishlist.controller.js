import * as z from "zod";
import prisma from "../lib/prisma.js";
import { addToWishlistSchema } from "../utils/validationSchema.js";

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                imageUrl: true,
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true,
                  imageUrl: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return res.status(200).json({
      message: "Wishlist retrieved successfully.",
      data: {
        id: wishlist.id,
        items: wishlist.items,
        totalItems: wishlist.items.length,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to retrieve wishlist",
    });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const validated = addToWishlistSchema.parse(req.body);
    const { productId } = validated;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId },
      });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: productId,
        },
      },
    });

    if (existingItem) {
      return res.status(409).json({
        message: "Product already exists in wishlist.",
      });
    }

    const newItem = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Product added to wishlist successfully.",
      data: newItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid wishlist data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Item already exist in wishlist.",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to add item to wishlist",
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Validasi productId harus format UUID
    const validated = addToWishlistSchema.parse({ productId });

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found.",
      });
    }

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: validated.productId,
        },
      },
    });

    if (!wishlistItem) {
      return res.status(404).json({
        message: "Product not found in wishlist.",
      });
    }

    await prisma.wishlistItem.delete({
      where: {
        id: wishlistItem.id,
      },
    });

    return res.status(200).json({
      message: "Product removed from wishlist.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product ID.",
        errors: error.issues.map((issues) => ({
          path: issues.path.join("."),
          message: issues.message,
        })),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to remove item from wishlist.",
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist not found.",
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
      },
    });

    return res.status(200).json({
      message: "Wishlist cleared successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to clear wishlist.",
    });
  }
};

export const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const validated = addToWishlistSchema.parse({ productId });

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    });

    if (!wishlist) {
      return res.status(404).json({
        message: "Wishlist status.",
        data: {
          isInWishlist: false,
        },
      });
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: validated.productId,
        },
      },
    });

    return res.status(200).json({
      message: "Wishlist status.",
      data: {
        isInWishlist: !!existingItem,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid product ID.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to check wishlist status.",
    });
  }
};
