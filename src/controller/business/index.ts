import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { handlePrismaError } from "../../utils/PrimaErrorHandler";
import { RequiredParameterError } from "../../errors/appError";
import { generateUniqueUrl } from "../../utils/generateUniqueUrl";
import { fields } from "../../utils/lib";

const businessRouter = Router();

businessRouter.get(
  "/getallbusiness",
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
      const url = await generateUniqueUrl(
        businessName.toLowerCase().replace(/\s+/g, "-")
      );
      const businessDetails = await prisma.business.create({
        data: {
          businessName: businessName,
          location: location,
          about: about,
          userId,
          form: {
            create: {
              // businessId: business.id,
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
          },
          website: {
            create: {
              name: "new website",
              url: `${url}`,
              page: {
                create: {
                  slug: "/",
                  title: "Home",
                  label: "Home",
                  // websiteId: website.id,
                },
              },
            },
          },
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
businessRouter.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    try {
      const businessDetails = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          activeBusiness: {
            select: {
              id: true,
              businessName: true,
              about: true,
              location: true,
            },
          },
        },
      });
      console.log(businessDetails);
      res.json({
        message: "Business retrieved successfully",
        businessDetails: businessDetails.activeBusiness,
      });
    } catch (error) {
      // handlePrismaError(error, res);
      next(error);
    }
  }
);

businessRouter.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;
    try {
      if (!req.params.id) {
        throw new RequiredParameterError("business id");
      }

      const business = await prisma.business.delete({
        where: {
          id: req.params.id,
          userId,
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
    const userId = req.userId;

    try {
      if (!req.params.id) {
        throw new RequiredParameterError("Business id");
      }
      const updateBusiness = await prisma.business.update({
        where: {
          id: req.params.id,
          userId,
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
      const business = await prisma.user.update({
        where: {
          id: req.userId,
          // id: req.body.businessId,
        },
        data: {
          activeBusinessId: req.body.businessId,
        },
        include: {
          activeBusiness: true,
        },
      });

      res.json({
        message: "business switched",
        business: business.activeBusiness,
      });
    } catch (error) {
      next(error);
    }
  }
);
// businessRouter.get(
//   "/activebusiness",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const business = await prisma.business.findUnique({
//         where: {
//           userId: req.userId,
//           id: req.body.businessId,
//         },
//       });

//       res.json({ message: "active business retrieved successfully", business });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

export default businessRouter;
