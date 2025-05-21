import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { handlePrismaError } from "../../utils/PrimaErrorHandler";
import { RequiredParameterError } from "../../errors/appError";

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
    console.log(req.params.id);
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

export default businessRouter;
