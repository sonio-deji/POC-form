import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { HttpStatusCode } from "../errors/appError";

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

export const verifyApiToken = (
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
      businessId: string;
    };

    console.log(decoded);
    req.userId = decoded.userid;
    req.businessId = decoded.businessId;
    next();
  } catch (error) {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      error: "Token is not valid or expired",
    });
  }
};
