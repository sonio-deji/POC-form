import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { HttpStatusCode } from "../errors/appError";

export const verifyApiToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization: authHeader } = req.headers;
  console.log(authHeader.split(" "));
  if (!authHeader) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: "Authorization header not found",
      title: `BadRequestError: "Invalid JWT Token"`,
    });
  }
  const [, tkn] = authHeader.split(" ");
  console.log(tkn);

  try {
    jwt.verify(tkn, process.env.JWT_SEC, (error, user) => {
      if (error) res.status(403).json("Token is not valid");
      next();
    });
  } catch (e) {
    console.log(e);
  }

  next();
};
