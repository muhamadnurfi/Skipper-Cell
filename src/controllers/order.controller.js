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

        if (!product) throw new Error("PRODUCT_NOT_FOUND");

        if (product.stock < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
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
          statusHistories: {
            create: {
              fromStatus: null,
              toStatus: "PENDING",
              changedBy: "USER",
              note: "Order created",
            },
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
    console.log(error.message);

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({ message: "Insufficient stock." });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(500).json({
      message: "Internal server error during order creation.",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status: newStatus, note } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          payment: true,
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

      // PAYMENT VALIDASI
      if (["PAID", "PROCESSING", "SHIPPED", "COMPLETED"].includes(newStatus)) {
        if (!order.payment || order.payment.status !== "VERIFIED") {
          throw new Error("PAYMENT_NOT_VERIFIED");
        }
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

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: newStatus,
          statusHistories: {
            create: {
              fromStatus: currentStatus,
              toStatus: newStatus,
              changedBy: req.user.role,
              note: note || null,
            },
          },
        },
        include: {
          statusHistories: true,
        },
      });

      return updatedOrder;
    });

    return res.status(200).json({
      message: "Order status updated.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    const errorMap = {
      ORDER_NOT_FOUND: "Order not found.",
      ORDER_FINALIZED: "Order already finalized.",
      INVALID_TRANSITION: "Invalid status transition.",
      PAYMENT_NOT_VERIFIED: "Payment must be verified first.",
      INSUFFICIENT_STOCK: "Insufficient stock.",
    };

    return res.status(400).json({
      message: errorMap[error.message] || "Failed to update order status.",
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

export const getOrderTimeline = async (req, res) => {
  const { id } = req.params;

  try {
    const histories = await prisma.orderStatusHistory.findMany({
      where: {
        orderId: id,
      },
      orderBy: {
        createdBy: "asc",
      },
    });

    return res.status(200).json({
      message: "Order status timeline.",
      data: histories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch order timeline.",
    });
  }
};
