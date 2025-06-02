import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { HttpStatusCode } from "../errors/appError";
import prisma from "../utils/prisma";

export const isBusinessAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const userid = req.userId;
    const businessId = req.businessId;
    if (!userid || !businessId) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        error: "User ID or Business ID not found in request",
        title: `BadRequestError: "Invalid JWT Token"`,
      });
    }
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
        userId: userid,
      },
    });
    if (!business) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        error: "User is not authorized for this business",
        title: `BadRequestError: "Invalid JWT Token"`,
      });
    }
    next();
  } catch (error) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: "Token is not valid or expired",
    });
  }
};
