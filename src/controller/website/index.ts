import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotBeforeError } from "jsonwebtoken";
import { NotfoundError } from "../../errors/appError";

const websiteRoute = Router();

websiteRoute.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const website = await prisma.website.findFirst({
        where: {
          business: {
            user: {
              activeBusiness: {
                userId: req.userId,
              },
              id: req.id,
            },
          },
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

websiteRoute.put(
  "/changehome/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { websiteId } = req.params;

    const { homePage } = req.body;

    try {
      const home = await prisma.page.findUnique({
        where: {
          slug_websiteId: {
            slug: homePage,
            websiteId,
          },
          website: {
            business: {
              userId: req.userId,
            },
          },
        },
      });
      if (!home) {
        throw new NotfoundError("url");
      }

      // console.log(home);
      await prisma.website.update({
        where: {
          id: websiteId,
          business: {
            userId: req.userId,
          },
        },
        data: {
          homePage,
        },
      });
      res.json({ message: "Home page changed successfully", homePage: home });
    } catch (error) {
      next(error);
    }
  }
);

websiteRoute.get(
  "/websitedetails/websitedashboard",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const transactionRes = await prisma.$transaction(async () => {
        const websiteDashboard = await prisma.website.findFirst({
          where: {
            // businessId: req.businessId,
            business: {
              user: {
                activeBusiness: {
                  userId: req.userId,
                },
              },
            },
          },
          select: {
            published: true,
            header: true,
            footer: true,
            url: true,
          },
        });

        const business = await prisma.business.findUnique({
          where: {
            id: req.businessId,
          },
          include: {
            socialMedia: true,
          },
        });

        return { websiteDashboard, business };
      });

      // const {published,  ...websiteDashboard} = transactionRes.websiteDashboard
      res.json({
        message: "successful",
        websiteDashboard: {
          ...transactionRes.websiteDashboard,
          hasWebsite: !!transactionRes.websiteDashboard.header,
          hasCustomDomain:
            !transactionRes.websiteDashboard.url.endsWith("fluttersuite.com"),
          url: undefined,
          header: undefined,
          footer: undefined,
          socialMedia: undefined,
          hasSocials: transactionRes.business.socialMedia.length > 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

websiteRoute.post(
  "/changewebsiteurl",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    } catch (error) {}
  }
);
export default websiteRoute;
