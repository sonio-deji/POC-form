import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import websiteRoute from "../website/index";
import { BadRequestError, NotfoundError } from "../../errors/appError";
import { randomUUID } from "crypto";

const pageRoutes = Router();

pageRoutes.put(
  "/editpage/:pageId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pageId } = req.params;
      const { content, description, label, title, slug } = req.body;
      const page = await prisma.page.update({
        where: {
          id: pageId,
          website: {
            business: {
              userId: req.userId,
            },
          },
        },
        data: {
          content,
          description,
          label,
          title,
          slug,
        },
      });
      await prisma.website.update({
        where: {
          id: page.websiteId,
        },
        data: {
          lastModified: new Date(),
        },
      });
      res.json({ message: "Update successful", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.get(
  "/viewpage/:pageId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pageId } = req.params;
      const page = await prisma.page.findUnique({
        where: {
          id: pageId,
        },
        include: {
          website: {
            select: {
              header: true,
              footer: true,
              description: true,
              theme: true,
              name: true,
              lastModified: true,
              dateCreated: true,
              id: true,

              business: {
                select: {
                  form: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
            // include: {
            //   business: {
            //     include: {
            //       form: true,
            //     },
            //   },
            // },
          },
        },
      });
      console.log(page);
      res.json({ message: "page retrieved successfully", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.get(
  "/allpages/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pages = await prisma.page.findMany({
        where: {
          website: {
            id: req.params.websiteId,
            business: {
              userId: req.userId,
              website: {
                id: req.params.websiteId,
              },
            },
          },
        },
        select: {
          id: true,
          slug: true,
          websiteId: true,
          description: true,
          label: true,
          createdAt: true,
          img: true,
          content: true,
        },
      });
      res.json(pages);
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.post(
  "/addpage/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("running");
    try {
      const { websiteId } = req.params;
      const { slug, title, description, label, content, img } = req.body;
      const page = await prisma.page.create({
        data: {
          slug: randomUUID(),
          title,
          description,
          label,
          content,
          websiteId,
          img,
        },
      });
      res.json({ message: "page created successfully", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.delete(
  "/deletepage/:pageId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pageId } = req.params;
      const pageToDelete = await prisma.page.findUnique({
        where: { id: pageId },
        include: { website: true },
      });

      if (!pageToDelete) {
        throw new NotfoundError("page not found");
        // return res.status(404).json({ error: "Page not found" });
      }

      // Step 2: Check if this page is not the home page
      if (pageToDelete.slug !== pageToDelete.website?.homePage) {
        // Step 3: Delete the page
        const deletedPage = await prisma.page.delete({
          where: { id: pageId },
          select: {
            id: true,
          },
        });
        return res
          .status(200)
          .json({ message: "Page deleted", page: deletedPage });
      } else {
        throw new BadRequestError(
          "Cannot delete home page, please switch the home page to another page"
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

export default pageRoutes;
