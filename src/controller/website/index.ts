import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { NotBeforeError } from "jsonwebtoken";
import { NotfoundError, RequiredParameterError } from "../../errors/appError";
import { generateUniqueUrl } from "../../utils/generateUniqueUrl";

const websiteRoute = Router();
websiteRoute.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const website = await prisma.website.findFirst({
        where: {
          businessId:
            (
              await prisma.user.findUnique({
                where: { id: req.userId },
                select: { activeBusinessId: true },
              })
            )?.activeBusinessId ?? "",
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
          theme: true,
          business: {
            select: {
              form: {
                select: {
                  fields: true,
                  title: true,
                  description: true,
                  id: true,
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
      const { header, footer, favicon, description, theme } = req.body;
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
          theme,
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
  "/publish/:businessId",
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
        published: website.published,
      });
    } catch (error) {
      next(error);
    }
  }
);
websiteRoute.post(
  "/regenerate-website/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;
      const { header, footer, favicon, description, theme, content } = req.body;

      await prisma.page.deleteMany({
        where: {
          websiteId: websiteId,
        },
      });

      const updateWebsite = await prisma.website.update({
        where: {
          id: websiteId,
          business: {
            userId: req.userId,
          },
        },
        data: {
          header,
          footer,
          favicon,
          description,
          theme,
          page: {
            create: {
              slug: "home",
              title: "Home",
              label: "Home",
              content: content,
            },
          },
        },
      });
      res.json({ website: updateWebsite });
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
        throw new NotfoundError("page");
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
            businessId:
              (
                await prisma.user.findUnique({
                  where: { id: req.userId },
                  select: { activeBusinessId: true },
                })
              )?.activeBusinessId ?? "",
          },
          select: {
            published: true,
            header: true,
            footer: true,
            url: true,
            id: true,
            page: true,
            homePage: true,
          },
        });

        const business = await prisma.business.findFirst({
          where: {
            user: {
              id: req.userId,
              activeBusiness: {
                userId: req.userId,
              },
            },
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
          hasWebsite: transactionRes.websiteDashboard.page.find(
            (item) => item.slug === transactionRes.websiteDashboard.homePage
          )?.content
            ? true
            : false,
          hasCustomDomain:
            !transactionRes.websiteDashboard.url.endsWith("fluttersuite.com"),
          url: undefined,
          header: undefined,
          footer: undefined,
          socialMedia: undefined,
          hasSocials: transactionRes.business.socialMedia.length > 0,
          page: undefined,
          homePage: transactionRes.websiteDashboard.page.find(
            (item) => item.slug === transactionRes.websiteDashboard.homePage
          ).id,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

websiteRoute.post(
  "/changewebsiteurl/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { websiteId } = req.params;
    try {
      const { url } = req.body;
      if (!url) {
        throw new RequiredParameterError("URL is required");
      }
      await prisma.website.update({
        where: {
          id: websiteId,
        },
        data: {
          url,
        },
      });
      res.json({ message: "url updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);
export default websiteRoute;
