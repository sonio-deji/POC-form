// utils/prismaErrorHandler.ts
import { Prisma } from "@prisma/client";
import { Response } from "express";
import prisma from "./prisma";

export function handlePrismaError(error: any, res: Response) {
  switch (error.code) {
    case "P2002":
      return res.status(400).json({
        message: `A record with this ${(error.meta?.target as [])?.join(
          ", "
        )} already exists.`,
      });

    case "P2003":
      return res.status(400).json({
        message: `Foreign key constraint failed on field ${error.meta?.field_name}.`,
      });

    case "P2004":
      return res.status(400).json({
        message: "A database constraint failed.",
      });

    case "P2011":
      return res.status(400).json({
        message: `Null constraint violation on field ${error.meta?.target}.`,
      });

    case "P2014":
      return res.status(400).json({
        message: "This operation would violate a required relationship.",
      });

    case "P2015":
      error;
      return res.status(404).json({
        message: "The specified record was not found.",
      });

    case "P2025":
      return res.status(404).json({
        message: "Record to update or delete does not exist.",
      });

    default:
      return res.status(400).json({ message: error.message });
  }
}
