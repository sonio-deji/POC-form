import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

const websiteRoute = Router();

websiteRoute.get(
  "/:businessId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const website = await prisma.website.findUnique({
        where: {
          businessId: req.params.businessId,
        },
        select: {
          page: true,
          id: true,
          name: true,
          footer: true,
          header: true,
          favicon: true,
          description: true,
          content: true,
          url: true,
          published: true,
          homePage: true,
          businessId: true,
          business: {
            select: {
              form: {
                select: {
                  fields: true,
                  title: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      res.json({ message: "Website retrieved", website });
    } catch (error) {
      next(error);
    }
  }
);

websiteRoute.put(
  "/:websiteid",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteid } = req.params;
      const { header, footer, favicon, description } = req.body;
      const updateWebsite = await prisma.website.update({
        where: {
          id: websiteid,
          business: {
            userId: req.userId,
          },
        },
        data: {
          header,
          footer,
          favicon,
          description,
        },
      });
      res.json({
        message: "website updated successfully",
        website: updateWebsite,
      });
    } catch (error) {
      next(error);
    }
  }
);
websiteRoute.get(
  "/publish/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;
      console.log(websiteId);

      await prisma.website.update({
        where: {
          id: websiteId,
          business: {
            userId: req.userId,
          },
        },
        data: {
          published: true,
        },
      });
      res.json({ message: "Website published successfully" });
    } catch (error) {
      next(error);
    }
  }
);
websiteRoute.get(
  "/unpublish/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;

      await prisma.website.update({
        where: {
          id: websiteId,
          business: {
            userId: req.userId,
          },
        },
        data: {
          published: false,
        },
      });
      res.json({ message: "Website unpublished successfully" });
    } catch (error) {
      next(error);
    }
  }
);
websiteRoute.get(
  "/isPublished/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;

      const website = await prisma.website.update({
        where: {
          id: websiteId,
          business: {
            userId: req.userId,
          },
        },
        data: {
          published: false,
        },
      });
      res.json({
        message: "Website unpublished successfully",
        published: website.published,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default websiteRoute;
