import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotfoundError } from "../../errors/appError";

const analytics = Router();

analytics.get(
  "/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;
      const analytics = await prisma.analytics.findUnique({
        where: {
          websiteId,
          website: {
            business: {
              userId: req.userId,
            },
          },
        },
        include: {
          visitsByBrowser: true,
          visitsByLocation: true,
        },
      });
      if (!analytics) {
        throw new NotfoundError("analytics");
      }
      console.log(analytics);
      res.json({ message: "Analytics gotten successfully", analytics });
    } catch (error) {}
  }
);

export default analytics;
