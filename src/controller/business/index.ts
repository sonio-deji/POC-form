import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { handlePrismaError } from "../../utils/PrimaErrorHandler";
import { RequiredParameterError } from "../../errors/appError";
import { generateUniqueUrl } from "../../utils/generateUniqueUrl";

const businessRouter = Router();

businessRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    try {
      const allBusiness = await prisma.business.findMany({
        where: {
          userId,
        },
        select: {
          businessName: true,
          location: true,
          about: true,
          id: true,
        },
      });
      res.json({
        message: "Business retrieved successfully",
        businesses: allBusiness,
      });
    } catch (error) {
      next(error);
      // return handlePrismaError(error, res);
    }
  }
);

businessRouter.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const { about, location, businessName } = req.body;
    if (!about) {
      throw new RequiredParameterError("about");
    }
    if (!location) {
      throw new RequiredParameterError("location");
    }
    if (!businessName) {
      throw new RequiredParameterError("business name");
    }
    try {
      const businessDetails = await prisma.business.create({
        data: {
          about,
          location,
          businessName,
          userId,
        },
        select: {
          about: true,
          location: true,
          businessName: true,
          id: true,
        },
      });
      const fields = [
        {
          title: "email",
          type: "email",
          options: [""],
          required: true,
        },
        {
          title: "name",
          type: "text",
          options: [""],
          required: true,
        },
        {
          title: "message",
          type: "text",
          options: [""],
          required: true,
        },
      ];
      const url = await generateUniqueUrl(
        businessDetails.businessName.toLowerCase().replace(/\s+/g, "-")
      );
      const website = await prisma.website.create({
        data: {
          name: "new website",
          businessId: businessDetails.id,
          url: `${url}`,
        },
      });

      await prisma.page.create({
        data: {
          slug: "/",
          title: "Home",
          label: "Home",
          websiteId: website.id,
        },
      });

      await prisma.form.create({
        data: {
          businessId: businessDetails.id,
          title: "new form",
          fields: {
            create: fields.map((field) => ({
              label: field.title,
              type: field.type,
              required: field.required,
              options: field.options,
            })),
          },
        },
      });
      res.json({ message: "Business created successfully", businessDetails });
    } catch (error) {
      // handlePrismaError(error, res);
      next(error);
    }
  }
);
businessRouter.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    try {
      const businessDetails = await prisma.business.findUnique({
        where: {
          id: req.params.id,
          website: {
            business: {
              userId,
            },
          },
        },
        select: {
          about: true,
          location: true,
          businessName: true,
          id: true,
        },
      });

      res.json({ message: "Business created successfully", businessDetails });
    } catch (error) {
      // handlePrismaError(error, res);
      next(error);
    }
  }
);

businessRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.params.id) {
        throw new RequiredParameterError("business id");
      }
      const business = await prisma.business.delete({
        where: {
          id: req.params.id,
        },
      });
      res.json({ message: "Business deleted successfully", business });
    } catch (error) {
      // console.log(error);
      next(error);
      // res.status(503).json({ message: "Something went wrong" });
    }
  }
);

businessRouter.put(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { about, location, businessName } = req.body;
    try {
      if (!req.params.id) {
        throw new RequiredParameterError("Business id");
      }
      const updateBusiness = await prisma.business.update({
        where: {
          id: req.params.id,
        },
        data: {
          about: about,
          location: location,
          businessName: businessName,
        },
      });
      res.json({
        message: "Business updated successfully",
        business: updateBusiness,
      });
    } catch (error) {
      next(error);
    }
  }
);

businessRouter.post(
  "/switchbusiness",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await prisma.business.findUnique({
        where: {
          userId: req.userId,
          id: req.body.businessId,
        },
      });
      if (!business) {
        return res.status(403).json({ message: "Not authorized" });
      }
      req.businessId = business.id;
      res.json({ message: "business switched", business });
    } catch (error) {
      next(error);
    }
  }
);
businessRouter.get(
  "/activebusiness",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const business = await prisma.business.findUnique({
        where: {
          userId: req.userId,
          id: req.body.businessId,
        },
      });

      res.json({ message: "active business retrieved successfully", business });
    } catch (error) {
      next(error);
    }
  }
);

export default businessRouter;
