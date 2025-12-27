import prisma from "../lib/prisma.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

export const getAllPayments = async (req, res) => {
  const { status } = req.params;

  try {
    const payments = await prisma.payment.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "List of payments.",
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch payments",
    });
  }
};

export const uploadPaymentProof = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Payment proof image is required.",
      });
    }

    // ambil payment + order
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    if (payment.order.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    if (payment.status !== "PENDING") {
      throw new Error("PAYMENT_ALREADY_PROCESSED");
    }

    if (payment.order.status !== "PENDING") {
      throw new Error("INVALID_ORDER_STATUS");
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer);

    const updatedPayment = await prisma.$transaction(async (tx) => {
      return tx.payment.update({
        where: { id },
        data: {
          proofUrl: uploadResult.secure_url,
          paidAt: new Date(),
        },
      });
    });

    return res.status(200).json({
      message:
        "Payment proof uploaded successfully. Waiting for admin verification.",
      data: updatedPayment,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(400).json({
        message: "Access denied.",
      });
    }

    if (error.message === "PAYMENT_ALREADY_PROCESSED") {
      return res.status(400).json({
        message: "Payment already verified or rejected.",
      });
    }

    if (error.message === "INVALID_ORDER_STATUS") {
      return res.status(400).json({
        message: "Cannot upload proof for this order status.",
      });
    }

    return res.status(500).json({
      message: "Failed to upload payment proof.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ambil payment + order + items
      const payment = await tx.payment.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error(`PAYMENT_NOT_FOUND`);
      }

      if (payment.status !== "PENDING") {
        throw new Error(`PAYMENT_ALREADY_PROCESSED`);
      }

      // update payment -> verified
      await tx.payment.update({
        where: { id },
        data: {
          status: "VERIFIED",
        },
      });

      // update order -> paid
      await tx.order.update({
        where: {
          id: payment.order.id,
        },
        data: {
          status: "PAID",
        },
      });

      // reduce stock
      for (const item of payment.order.items) {
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
          throw new Error(`INSUFFICIENT_STOCK`);
        }
      }

      return payment;
    });

    res.status(200).json({
      message: "Payment verified successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Payment not found.",
      });
    }

    if (error.message === "PAYMENT_ALREADY_PROCESSED") {
      return res.status(400).json({
        message: "Payment already verified or rejected.",
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient stock for one or more products.",
      });
    }

    return res.status(500).json({
      message: "Failed to verify payment.",
    });
  }
};

export const rejectPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      if (payment.status !== "PENDING") {
        throw new Error("PAYMENT_ALREADY_PROCESSED");
      }

      if (payment.order.status === "COMPLETED") {
        throw new Error("ORDER_ALREADY_COMPLETED");
      }

      // update payment -> reject
      await tx.payment.update({
        where: { id },
        data: {
          status: "REJECTED",
        },
      });

      // update order -> cancelled
      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          status: "CANCELLED",
        },
      });

      return payment;
    });
    return res.status(200).json({
      message: "Payment rejected successfully.",
      data: result,
    });
  } catch (error) {
    console.error(error);

    if (error.message === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (error.message === "PAYMENT_ALREADY_PROCESSED") {
      return res.status(400).json({
        message: "Payment already verified or rejected.",
      });
    }

    if (error.message === "ORDER_ALREADY_COMPLETED") {
      return res.status(400).json({
        message: "Completed order cannot be rejected.",
      });
    }
    return res.status(500).json({
      message: "Failed to reject payment.",
    });
  }
};
