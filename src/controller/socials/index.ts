import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { RequiredParameterError } from "../../errors/appError";

const socialMediaRoutes = Router();

socialMediaRoutes.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.socialMedia.findMany({
        where: {
          businessId: req.businessId,
        },
        select: {
          platform: true,
          url: true,
        },
      });
      res.json({
        message: "socials retrieved successfully",
        socialMedias: items,
      });
    } catch (error) {
      next(error);
    }
  }
);

socialMediaRoutes.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { platform, url } = req.body;
    try {
      if (!platform) {
        throw new RequiredParameterError("platform");
      }
      if (!url) {
        throw new RequiredParameterError("url");
      }
      const item = await prisma.socialMedia.create({
        data: {
          businessId: req.businessId,
          platform,
          url,
        },
        select: {
          url: true,
          platform: true,
        },
      });
      res.json({ message: "socials created", socials: item });
    } catch (error) {
      next(error);
    }
  }
);
socialMediaRoutes.post(
  "/addmanysocials",
  async (req: Request, res: Response, next: NextFunction) => {
    const { items } = req.body;
    try {
      if (!items) {
        throw new RequiredParameterError("platform");
      }

      const item = await prisma.socialMedia.createMany({
        data: items.map((link: { platform: string; url: string }) => ({
          platform: link.platform,
          url: link.url,
          businessId: req.businessId,
        })),
        skipDuplicates: true,
      });
      res.json({ message: "socials created", socials: item });
    } catch (error) {
      next(error);
    }
  }
);
export default socialMediaRoutes;
