import prisma from "../utils/prisma";

export const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const now = new Date();

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
        status: "active",
      },
      include: { subscription: true },
    });

    if (!subscription) {
      return res
        .status(403)
        .json({ message: "User has no active subscription" });
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Server error during subscription check" });
  }
};
