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

dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use("/api/user", authRouter);
app.use("/api/form", formRouter);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  switch (true) {
    case err instanceof InvalidParameterError:
    case err instanceof RequiredParameterError:
    case err instanceof UniqueConstraintError:
    case err instanceof UnauthorizedError:
    case err instanceof BadRequestError:
      return res.status(400).json({
        status: "error",
        error: err.message,
        message: err.message,
        title: err.name,
        stack: err.stack,
      });
    case err instanceof NotfoundError:
      return res.status(404).json({
        status: "error",
        error: err.message,
        message: err.message,
        title: err.name,
        stack: err.stack,
      });
    default:
  }
  next();
  // console.log(err)
  return res.status(500).json({
    status: "error",
    title: err.name,
    message: err.message,
    error: err.message,
    stack: err.stack,
  });
});

app.listen(PORT, () =>
  console.log(`
  🚀 Server ready at: http://localhost:${PORT}
`)
);
