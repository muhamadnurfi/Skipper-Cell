import prisma from "../lib/prisma.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

// export const payOrder = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       const order = await tx.order.findUnique({
//         where: { id },
//         include: {
//           items: true,
//         },
//       });

//       if (!order) {
//         throw new Error(`Order not found.`);
//       }

//       const currentStatus = order.status;

//       if (currentStatus !== "PENDING") {
//         throw new Error("Only PENDING orders can be paid.");
//       }

//       // cek & kurangi stok
//       for (const item of order.items) {
//         const updated = await tx.product.update({
//           where: {
//             id: item.productId,
//             stock: {
//               gte: item.quantity,
//             },
//           },
//           data: {
//             stock: {
//               decrement: item.quantity,
//             },
//           },
//         });

//         if (updated.count === 0) {
//           throw new Error("Insufficient stock during payment");
//         }
//       }

//       // ubah status menjadi PAID
//       const paidOrder = await tx.order.update({
//         where: { id },
//         data: {
//           status: {
//             set: "PAID",
//           },
//         },
//       });

//       return paidOrder;
//     });

//     res.status(200).json({
//       message: "Payment successfull.",
//       data: result,
//     });
//   } catch (error) {
//     console.error(error.message);

//     res.status(400).json({
//       message: error.message || "Payment failed",
//     });
//   }
// };

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
