import * as z from "zod";
import prisma from "../lib/prisma.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Order items required.",
      });
    }

    // Ambil semua product
    const productIds = items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    // Map productId -> product
    const productMap = {};
    products.forEach((p) => {
      productMap[p.id] = p;
    });

    let totalPrice = 0;

    const orderItemsData = items.map((item) => {
      const product = productMap[item.productId];

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      return {
        product: {
          connect: {
            id: product.id,
          },
        },
        quantity: item.quantity,
        price: product.price,
      };
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        totalPrice,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Order created successfully.",
      data: order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid order data.",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.errors,
        })),
      });
    }

    console.log(error);
    res.status(500).json({
      message: "Internal server error during order creation.",
    });
  }
};
