import express from "express";
import { ZodSchema } from "zod";

export const validator =
  (schema: ZodSchema) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.formErrors });
    }
    req.body = result.data;
    next();
  };
