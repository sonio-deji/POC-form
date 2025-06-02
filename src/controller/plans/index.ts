import axios from "axios";
import { Router, Request, Response, NextFunction } from "express";

const planRoutes = Router();

planRoutes.get(
  "/get-plans",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await axios.get("https://api.paystack.co/plan", {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
        },
      });

      console.log(response.data);
      res.json({ message: "Successful" });
    } catch (error) {
      next(error);
    }
  }
);

export default planRoutes;
