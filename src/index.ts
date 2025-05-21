import { Prisma, PrismaClient } from "@prisma/client";
import * as express from "express";
import authRouter from "./controller/authentication";
import * as dotenv from "dotenv";
import { Application, NextFunction, Request, Response } from "express";
import {
  BadRequestError,
  InvalidParameterError,
  NotfoundError,
  RequiredParameterError,
  UnauthorizedError,
  UniqueConstraintError,
} from "./errors/appError";
import formRouter from "./controller/form";
import { verifyApiToken } from "./middleware/verifyToken";
import * as swaggerjsdocs from "swagger-jsdoc";
import * as swaggerui from "swagger-ui-express";
import businessRouter from "./controller/business";
import { checkEmailVerified } from "./middleware/emailVerified";
import { handlePrismaError } from "./utils/PrimaErrorHandler";
import websiteRoute from "./controller/website";

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

const options: swaggerjsdocs.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "a node js app",
      version: "1.0.0",
    },
    components: {
      securitySchemas: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers: [
      {
        url: "http://localhost:5000/",
      },
    ],
  },
  apis: ["./src/**/*.ts"],
};

const swaggerspecs = swaggerjsdocs(options);
const swaggerdocumentation = (port: number) => {
  app.use("/api-docs", swaggerui.serve, swaggerui.setup(swaggerspecs));
  app.get("docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-type", "application/json");
    res.send(swaggerspecs);
  });
};

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use("/api/user", authRouter);
app.use("/api/form", verifyApiToken, formRouter);
app.use("/api/business", verifyApiToken, checkEmailVerified, businessRouter);
app.use("/api/website", verifyApiToken, checkEmailVerified, websiteRoute);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Handle specific Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Example: unique constraint error
    return handlePrismaError(err, res);
    // if (err.code === "P2002") {
    //   return res.status(409).json({
    //     status: "error",
    //     title: "UniqueConstraintError",
    //     message: "A record with that field already exists.",
    //     meta: err.meta,
    //   });
    // }
  }

  // Handle your custom app errors
  if (
    err instanceof InvalidParameterError ||
    err instanceof RequiredParameterError ||
    err instanceof UniqueConstraintError ||
    err instanceof UnauthorizedError ||
    err instanceof BadRequestError
  ) {
    return res.status(err.statusCode || 400).json({
      status: "error",
      title: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err instanceof NotfoundError) {
    return res.status(404).json({
      status: "error",
      title: err.name,
      message: err.message,
      stack: err.stack,
    });
  }

  // Fallback for unhandled errors
  return res.status(500).json({
    status: "error",
    title: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred",
    stack: err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`
  🚀 Server ready at: http://localhost:${PORT}
`);
  swaggerdocumentation(Number(PORT));
});
