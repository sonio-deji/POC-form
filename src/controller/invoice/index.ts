import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { RequiredParameterError } from "../../errors/appError";

const invoiceRoutes = Router();

invoiceRoutes.post(
  "/:businessId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoice, items } = req.body;
      if (!invoice) {
        throw new RequiredParameterError("invoice");
      }
      if (!items) {
        throw new RequiredParameterError("items");
      }
      const { dueDate, vat, charges, customerId } = invoice;
      if (!charges) {
        throw new RequiredParameterError("charges");
      }
      if (!vat) {
        throw new RequiredParameterError("vat");
      }
      if (!dueDate) {
        throw new RequiredParameterError("dueDate");
      }
      if(!customerId){
        throw new RequiredParameterError("customerId");
      }

      const businessId = req.params.businessId;
      if (!businessId) {
        throw new RequiredParameterError("businessId");
      }      

      const invoiceData = await prisma.invoice.create({
        data: {
          dueDate,
          businessId: req.params.businessId,
          vat,
          charges,
          customerId,
          invoiceItem: {
            create: items.map((item: any) => ({
              itemName: item.itemName,
              amount: item.amount,
              quantity: item.quantity ?? 1,
            })),
          },
        },
        include: {
          invoiceItem: true,
        },
      });
      res.json({ message: "invoice created", invoice: invoiceData });
    } catch (error) {
      next(error);
    }
  }
);

invoiceRoutes.get(
  "/invoiceitems/:businessId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await prisma.invoiceItem.findMany({
        where: {
          invoice: {
            business: {
              userId: req.userId,
            },
            businessId: req.params.businessId,
          },
        },
      });
      res.json({ message: "invoice items retrieved successfully", items });
    } catch (error) {
      next(error);
    }
  }
);
invoiceRoutes.delete(
  "/invoiceitems/:businessId",
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.query.id);
    if (!req.query.id) {
      throw new RequiredParameterError("invoice item");
    }
    try {
      const items = await prisma.invoiceItem.delete({
        where: {
          invoice: {
            business: {
              userId: req.userId,
            },
            businessId: req.params.businessId,
          },
          id: req.query.id as string,
        },
      });
      res.json({ message: "invoice items deleted successfully", items });
    } catch (error) {
      next(error);
    }
  }
);

export default invoiceRoutes;
