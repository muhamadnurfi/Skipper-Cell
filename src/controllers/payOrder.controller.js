import prisma from "../lib/prisma.js";

export const payOrder = async (req, res) => {
  const { id } = req.params;

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

      if (currentStatus !== "PENDING") {
        throw new Error("Only PENDING orders can be paid.");
      }

      // cek & kurangi stok
      for (const item of order.items) {
        const updated = await tx.product.update({
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
          throw new Error("Insufficient stock during payment");
        }
      }

      // ubah status menjadi PAID
      const paidOrder = await tx.order.update({
        where: { id },
        data: {
          status: {
            set: "PAID",
          },
        },
      });

      return paidOrder;
    });

    res.status(200).json({
      message: "Payment successfull.",
      data: result,
    });
  } catch (error) {
    console.error(error.message);

    res.status(400).json({
      message: error.message || "Payment failed",
    });
  }
};
