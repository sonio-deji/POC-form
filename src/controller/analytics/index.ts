import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotfoundError } from "../../errors/appError";

const analytics = Router();

analytics.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { websiteId } = req.params;
    const analytics = await prisma.analytics.findFirst({
      where: {
        website: {
          businessId:
            (
              await prisma.user.findUnique({
                where: { id: req.userId },
                select: { activeBusinessId: true },
              })
            )?.activeBusinessId ?? "",
        },
      },

      include: {
        visitsByBrowser: true,
        visitsByLocation: true,
      },
    });

    res.json({ message: "Analytics gotten successfully", analytics });
  } catch (error) {
    next(error);
  }
});

export default analytics;
