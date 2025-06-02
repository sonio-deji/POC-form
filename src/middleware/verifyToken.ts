import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { HttpStatusCode } from "../errors/appError";
import prisma from "../utils/prisma";

// extend Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      businessId?: string;
      id?: string;
    }
  }
}

export const verifyApiToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: "Authorization header not found or invalid",
      title: `BadRequestError: "Invalid JWT Token"`,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SEC as string) as {
      userid: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userid,
      },
      include: {
        activeBusiness: true,
      }
    })


    // console.log(decoded);
    req.userId = decoded.userid;
    const businessId = user?.activeBusiness?.id

    if (businessId) {
      req.businessId = businessId;
    }
    
    next();
  } catch (error) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: "Token is not valid or expired",
    });
  }
};
