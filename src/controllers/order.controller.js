import * as z from "zod";
import prisma from "../lib/prisma.js";

const allowedTransitions = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      message: "Order items required.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Ambil semua product id
      const productIds = items.map((item) => item.productId);

      // Ambil data product dari database
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

        if (product.stock < item.quantity) {
          throw new Error(`Stock not enough for product ${product.name}`);
        }

        const itemTotal = product.price * item.quantity;
        totalPrice += itemTotal;

        return {
          productId: product.id,
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
            create: orderItemsData.map((item) => ({
              product: {
                connect: {
                  id: item.productId,
                },
              },
              quantity: item.quantity,
              price: item.price,
            })),
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

      // ketika di order maka payment dibuat
      await tx.payment.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          amount: totalPrice,
          order: {
            connect: {
              id: order.id,
            },
          },
        },
      });

      return order;
    });

    return res.status(201).json({
      message: "Order created successfully.",
      data: result,
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

    if (error.message.includes("Insufficient stock")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.log(error);
    res.status(500).json({
      message: "Internal server error during order creation.",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status: newStatus } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error(`Order not found.`);
      }

      const currentStatus = order.status;

      if (["COMPLETED", "CANCELLED"].includes(currentStatus)) {
        throw new Error(
          `Order already ${currentStatus}, status cannot be changed.`
        );
      }

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}.`
        );
      }

      // PENDING -> PAID (kurangi stock)
      if (currentStatus === "PENDING" && newStatus === "PAID") {
        for (const item of order.items) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: {
                gte: item.quantity,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          if (updated.count === 0) {
            throw new Error("Insufficient stock");
          }
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });
    });

    res.status(200).json({
      message: "Order status updated.",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update order status.",
    });
  }
};

export const getOrderDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            proofUrl: true,
            reason: true,
            paidAt: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (role === "USER" && order.userId !== userId) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      message: "Order detail.",
      data: order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch order detail.",
    });
  }
};
