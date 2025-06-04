import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import axios from "axios";
import crypto from "crypto";
import { NotfoundError } from "../../errors/appError";

const subscriptionRoutes = Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_TEST_SECRET_KEY;
const CALLBACK_URL =
  process.env.PAYSTACK_CALLBACK_URL ||
  "http://localhost:3000/paystack/callback";

subscriptionRoutes.get(
  "/getallSubscriptions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscriptions = await prisma.subscription.findMany({
        select: {
          id: true,
          name: true,
          price: true,
          durationMonths: true,
        },
      });
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
      const { subscriptionId } = req.body;
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });
      const user = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
      });
      if (!user) {
        throw new NotfoundError("User not found");
      }
      if (!subscription) throw new NotfoundError("Subscription not found");

      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: user.email,
          amount: subscription.price * 100,
          callback_url: CALLBACK_URL,
          metadata: { userId: user.id, subscriptionId },
        },
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );

      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: subscription.price,
          reference: response.data.data.reference,
          status: "pending",
          metadata: { subscriptionId, userId: req.userId },
        },
      });

      res.json({ authorization_url: response.data.data.authorization_url });
    } catch (error) {
      next(error);
    }
  }
);

subscriptionRoutes.post(
  "/paystack/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.status(401).send("Invalid signature");
      }

      const event = req.body.event;
      const data = req.body.data;

      if (event === "charge.success") {
        const reference = data.reference;
        const payment = await prisma.payment.update({
          where: { reference },
          data: { status: "success" },
        });

        const { userId, subscriptionId } = data.metadata;
        const plan = await prisma.subscription.findUnique({
          where: { id: subscriptionId },
        });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + plan.durationMonths);

        await prisma.userSubscription.create({
          data: {
            userId,
            subscriptionId,
            startDate,
            endDate,
            status: "active",
          },
        });
      }
      console.log("running");

      res.json({ message: "Payment successful" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

export default subscriptionRoutes;
