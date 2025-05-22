import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";

const pageRoutes = Router();

pageRoutes.put(
  "/:pageId",
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
          lastModfified: new Date(),
        },
      });
      res.json({ message: "Update successful", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.get(
  "/:pageId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pageId } = req.params;
      const page = await prisma.page.findUnique({
        where: {
          id: pageId,
        },
      });
      console.log(page);
      res.json({ message: "page retrieved successfully", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.post(
  "/:websiteId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { websiteId } = req.params;
      const { slug, title, description, label, content } = req.body;
      const page = await prisma.page.create({
        data: {
          slug,
          title,
          description,
          label,
          content,
          websiteId,
        },
      });
      res.json({ message: "page created successfully", page });
    } catch (error) {
      next(error);
    }
  }
);
pageRoutes.delete(
  "/:pageId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pageId } = req.params;
      const page = await prisma.page.delete({
        where: {
          id: pageId,
        },
      });
      console.log(page);
      res.json({ message: "page deleted successfully", page });
    } catch (error) {
      next(error);
    }
  }
);

export default pageRoutes;
