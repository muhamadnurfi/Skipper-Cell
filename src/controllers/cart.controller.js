import * as z from "zod";
import prisma from "../lib/prisma.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../utils/validationSchema.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
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

    // Jika tidak ada cart, buat cart baru
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
        },
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

    // Hitung total harga
    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    // Hitung total item
    const totalItems = cart.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return res.status(200).json({
      message: "Cart retrieved successfully.",
      data: {
        id: cart.id,
        items: cart.items,
        totalPrice,
        totalItems,
        createdAt: cart.createdAt,
        updateAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to retrieve cart.",
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const validated = addToCartSchema.parse(req.body);
    const { productId, quantity } = validated;

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

    // Cek stock
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available stock: ${product.stock}`,
      });
    }

    // Cari atau buat cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Cek apakah item sudah ada di cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
    });

    // Penambahan quantity, jika sudah ada item pada cart
    if (existingItem) {
      // Update quantity jika item sudah ada
      const newQuantity = existingItem.quantity + quantity;

      // Cek stock lagi
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Insufficient stock. Available stock: ${product.stock}`,
        });
      }

      const updatedItem = await prisma.cartItem.update({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId,
          },
        },
        data: {
          quantity: newQuantity,
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

      return res.status(200).json({
        message: "Cart item updated successfully.",
        data: updatedItem,
      });
    }

    // Tambahkan item baru ke cart
    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
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
      message: "Item added to cart successfully.",
      data: newItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid cart data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Handle unique constraint error (jika terjadi)
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Item already exists in cart.",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to add item to cart.",
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const validated = updateCartItemSchema.parse(req.body);
    const { quantity } = validated;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
      });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available stock: ${cartItem.product.stock}`,
      });
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity,
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

    return res.status(200).json({
      message: "Cart item updated successfully.",
      data: updatedItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid cart data",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Failed to update cart item.",
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
      });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    await prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    return res.status(200).json({
      message: "Item removed from cart successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to remove cart.",
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found.",
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return res.status(200).json({
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to clear cart.",
    });
  }
};
