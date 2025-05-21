import { Business, Prisma, User } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import { BadRequestError, RequiredParameterError } from "../../errors/appError";
import { validatePassword } from "../../utils/validator/validatePassword";
import * as CryptoJs from "crypto-js";
import * as jwt from "jsonwebtoken";
import * as bcryptjs from "bcryptjs";
import { verifyApiToken } from "../../middleware/verifyToken";
import { validateEmail } from "../../utils/validator/validateEmail";
import { handlePrismaError } from "../../utils/PrimaErrorHandler";
import { generateUniqueUrl } from "../../utils/generateUniqueUrl";

const authRouter = Router();
/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - businessDetails
 *             properties:
 *               user:
 *                 type: object
 *                 required:
 *                   - email
 *                   - password
 *                   - firstName
 *                   - lastName
 *                 properties:
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *               businessDetails:
 *                 type: object
 *                 required:
 *                   - about
 *                   - businessName
 *                   - location
 *                 properties:
 *                   about:
 *                     type: string
 *                   businessName:
 *                     type: string
 *                   location:
 *                     type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 user:
 *                   type: object
 *                 business:
 *                   type: object
 *                 token:
 *                   type: string
 */
authRouter.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const userObj: User = req.body.user;
    const businessDetails: Business = req.body.businessDetails;

    try {
      if (!userObj.email) {
        throw new RequiredParameterError("Email");
      }
      if (!userObj.password) {
        throw new RequiredParameterError("Password");
      }
      if (!userObj.firstName) {
        throw new RequiredParameterError("firstName");
      }
      if (!userObj.lastName) {
        throw new RequiredParameterError("lastName");
      }
      if (!businessDetails.about) {
        throw new RequiredParameterError("about business");
      }
      if (!businessDetails.businessName) {
        throw new RequiredParameterError("business name");
      }
      if (!businessDetails.location) {
        throw new RequiredParameterError("business location");
      }

      if (!validateEmail(userObj.email)) {
        throw new BadRequestError(
          `'${userObj.email}' is not a valid email address`
        );
      }
      if (!validatePassword(userObj.password)) {
        throw new BadRequestError(`Password must be at least 6 characters`);
      }

      const saltRounds = 10;
      const hashedPassword = await bcryptjs.hash(userObj.password, saltRounds);
      const transactionRes = await prisma.$transaction(async (prisma) => {
        const user = await prisma.user.create({
          data: {
            ...userObj,
            password: hashedPassword,
          },

          select: {
            email: true,
            emailVerified: true,

            firstName: true,
            lastName: true,
            id: true,
          },
        });
        const business = await prisma.business.create({
          data: {
            businessName: businessDetails.businessName,
            location: businessDetails.location,
            about: businessDetails.about,
            userId: user.id,
          },
          select: {
            businessName: true,
            about: true,
            location: true,
            id: true,
          },
        });

        const fields = [
          {
            title: "email",
            type: "email",
            options: [""],
            required: true,
          },
          {
            title: "name",
            type: "text",
            options: [""],
            required: true,
          },
          {
            title: "message",
            type: "text",
            options: [""],
            required: true,
          },
        ];
        const url = await generateUniqueUrl(
          business.businessName.toLowerCase().replace(/\s+/g, "-")
        );
        const website = await prisma.website.create({
          data: {
            name: "new website",
            businessId: business.id,
            url: `${url}`,
          },
        });

        await prisma.page.create({
          data: {
            slug: "/",
            title: "Home",
            label: "Home",
            websiteId: website.id,
          },
        });

        await prisma.form.create({
          data: {
            businessId: business.id,
            title: "new form",
            fields: {
              create: fields.map((field) => ({
                label: field.title,
                type: field.type,
                required: field.required,
                options: field.options,
              })),
            },
          },
        });

        const accessToken = jwt.sign(
          { id: userObj.email, userid: userObj.id },
          process.env.JWT_SEC,
          {
            expiresIn: "3d",
          }
        );
        return {
          user: {
            ...user,
            id: undefined,
          },
          business: { ...business, id: undefined },
          token: accessToken,
        };
      });

      return res.status(200).json({
        message: "User created successfully",
        ...transactionRes,
      });
    } catch (error) {
      // return handlePrismaError(error, res);
      next(error);
      // console.log(error);
      // res.status(503).send();
    }
  }
);
/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: strongpassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         emailVerified:
 *                           type: boolean
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid credentials or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username or password incorrect
 */
authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    try {
      if (!req.body.email) {
        throw new RequiredParameterError("Email");
      }
      if (!req.body.password) {
        throw new RequiredParameterError("Password");
      }
      const user = await prisma.user.findUnique({
        where: {
          email: req.body.email,
        },
        select: {
          email: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
          password: true,
          id: true,
          businesses: true,
        },
      });

      if (!user) {
        return res.status(400).json({
          message: "Username or password incorrect",
        });
      }
      const isPasswordValid = await bcryptjs.compare(
        req.body.password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          message: "Username or password incorrect",
        });
      }
      const accessToken = jwt.sign(
        { id: user.email, userid: user.id },
        process.env.JWT_SEC,
        {
          expiresIn: "3d",
        }
      );
      return res.status(200).json({
        message: "login successful",
        data: {
          user: {
            email: user.email,
            emailVerified: user.emailVerified,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token: accessToken,
        },
      });
    } catch (error) {
      next(error);
      // return handlePrismaError(error, res);
    }
  }
);
authRouter.post(
  "/update-password",
  verifyApiToken,
  (req: Request, res: Response) => {
    console.log("logging");
  }
);

export default authRouter;
