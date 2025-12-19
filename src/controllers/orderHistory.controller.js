import prisma from "../lib/prisma.js";

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      messsage: "Your order history.",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch order history",
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "All orders.",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};
