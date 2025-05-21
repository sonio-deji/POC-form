import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { HttpStatusCode } from "../errors/appError";

const prisma = new PrismaClient();

export const checkEmailVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: "User not authenticated",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user || !user.emailVerified) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: "Email not verified",
      });
    }

    next();
  } catch (error) {
    console.error("Email verification check failed:", error);
    return res.status(HttpStatusCode.INTERNAL_SERVER).json({
      error: "Internal server error while checking email verification",
    });
  }
};
