import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

const subscriptionRoutes = Router();

subscriptionRoutes.get(
  "/getallSubscriptions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscriptions = await prisma.subscription.findMany();
      res.json(subscriptions);
    } catch (error) {
      next(error);
    }
  }
);

subscriptionRoutes.post(
  "/subscribe",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, subscriptionId } = req.body;
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });
      if (!subscription)
        return res.status(404).json({ message: "Plan not found" });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + subscription.durationMonths);

      const userSubscription = await prisma.userSubscription.create({
        data: {
          userId,
          subscriptionId,
          startDate,
          endDate,
          status: "active",
        },
      });

      res.json(userSubscription);
    } catch (error) {
      next(error);
    }
  }
);

export default subscriptionRoutes;
