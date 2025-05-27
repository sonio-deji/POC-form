import { Business, Prisma, User, Website } from "@prisma/client";
import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import {
  BadRequestError,
  InvalidParameterError,
  RequiredParameterError,
  UnauthorizedError,
} from "../../errors/appError";
import { validatePassword } from "../../utils/validator/validatePassword";
import * as CryptoJs from "crypto-js";
import * as jwt from "jsonwebtoken";
import * as bcryptjs from "bcryptjs";
import { verifyApiToken } from "../../middleware/verifyToken";
import { validateEmail } from "../../utils/validator/validateEmail";
import { handlePrismaError } from "../../utils/PrimaErrorHandler";
import { generateUniqueUrl } from "../../utils/generateUniqueUrl";
import { fields, generateRandomNumber } from "../../utils/lib";

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
    const userObj = req.body.user;
    const businessDetails: Business = req.body.businessDetails;
    const websiteDetails: Website = req.body.websiteDetails;

    // console.log(userObj, businessDetails, websiteDetails);
    try {
      if (!userObj.email) {
        throw new RequiredParameterError("Email");
      }
      if (!userObj.password) {
        throw new RequiredParameterError("Password");
      }
      if (!userObj.confirmPassword) {
        throw new RequiredParameterError("Confirm password");
      }
      if (!userObj.firstName) {
        throw new RequiredParameterError("firstName");
      }
      if (!userObj.lastName) {
        throw new RequiredParameterError("lastName");
      }

      if (!businessDetails.businessName) {
        throw new RequiredParameterError("business name");
      }
      if (!businessDetails.location) {
        throw new RequiredParameterError("business location");
      }

      if (!websiteDetails.theme) {
        throw new RequiredParameterError("website theme");
      }
      if (!websiteDetails.header) {
        throw new RequiredParameterError("website header");
      }

      if (!websiteDetails.footer) {
        throw new RequiredParameterError("website footer");
      }

      if (!websiteDetails.content) {
        throw new RequiredParameterError("website content");
      }

      if (!validateEmail(userObj.email)) {
        throw new BadRequestError(
          `'${userObj.email}' is not a valid email address`
        );
      }
      if (userObj.password !== userObj.confirmPassword) {
        throw new InvalidParameterError(
          "password and confirm password do not match"
        );
      }
      if (!validatePassword(userObj.password)) {
        throw new BadRequestError(`Password must be at least 6 characters`);
      }

      const saltRounds = 10;
      const hashedPassword = await bcryptjs.hash(userObj.password, saltRounds);
      // const transactionRes = await prisma.$transaction(async (prisma) => {

      //   // const business = await prisma.business.create({
      //   //   data: {
      //   //     businessName: businessDetails.businessName,
      //   //     location: businessDetails.location,
      //   //     about: businessDetails.about,
      //   //     userId: user.id,
      //   //   },
      //   //   select: {
      //   //     businessName: true,
      //   //     about: true,
      //   //     location: true,
      //   //     id: true,
      //   //   },
      //   // });

      //   // const fields = [
      //   //   {
      //   //     title: "email",
      //   //     type: "email",
      //   //     options: [""],
      //   //     required: true,
      //   //   },
      //   //   {
      //   //     title: "name",
      //   //     type: "text",
      //   //     options: [""],
      //   //     required: true,
      //   //   },
      //   //   {
      //   //     title: "message",
      //   //     type: "textarea",
      //   //     options: [""],
      //   //     required: true,
      //   //   },
      //   //   {
      //   //     title: "category",
      //   //     type: "text",
      //   //     options: [""],
      //   //     required: true,
      //   //   },
      //   // ];
      //   // const url = await generateUniqueUrl(
      //   //   business.businessName.toLowerCase().replace(/\s+/g, "-")
      //   // );
      //   // const website = await prisma.website.create({
      //   //   data: {
      //   //     name: "new website",
      //   //     businessId: business.id,
      //   //     url: `${url}`,
      //   //   },
      //   // });

      //   // await prisma.page.create({
      //   //   data: {
      //   //     slug: "/",
      //   //     title: "Home",
      //   //     label: "Home",
      //   //     websiteId: website.id,
      //   //   },
      //   // });

      //   // await prisma.form.create({
      //   //   data: {
      //   //     businessId: business.id,
      //   //     title: "new form",
      //   //     fields: {
      //   //       create: fields.map((field) => ({
      //   //         label: field.title,
      //   //         type: field.type,
      //   //         required: field.required,
      //   //         options: field.options,
      //   //       })),
      //   //     },
      //   //   },
      //   // });

      //   const accessToken = jwt.sign(
      //     { id: userObj.email, userid: userObj.id, businessId: user.businesses[0].id },
      //     process.env.JWT_SEC,
      //     {
      //       expiresIn: "3d",
      //     }
      //   );
      //   // return {
      //   //   user: {
      //   //     ...user,
      //   //     id: undefined,
      //   //   },
      //   //   business: { ...business, id: undefined },
      //   //   token: accessToken,
      //   // };
      // });

      const url = await generateUniqueUrl(
        businessDetails.businessName.toLowerCase().replace(/\s+/g, "-")
      );
      const user = await prisma.user.create({
        data: {
          // ...userObj,
          firstName: userObj.firstName,
          lastName: userObj.lastName,
          email: userObj.email,
          password: hashedPassword,
          emailVerification: {
            create: {
              token: generateRandomNumber(6),
            },
          },
          businesses: {
            create: {
              businessName: businessDetails.businessName,
              location: businessDetails.location,
              about: businessDetails.businessName,

              form: {
                create: {
                  // businessId: business.id,
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
              },
              website: {
                create: {
                  name: "new website",
                  url: `${url}`,
                  header: websiteDetails.header,
                  footer: websiteDetails.footer,
                  theme: websiteDetails.theme,
                  page: {
                    create: {
                      slug: "/",
                      title: "Home",
                      label: "Home",
                      content: websiteDetails.content,

                      // websiteId: website.id,
                    },
                  },
                },
              },
            },
          },
        },

        select: {
          email: true,
          emailVerified: true,
          emailVerification: true,
          firstName: true,
          lastName: true,
          id: true,
          businesses: true,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          activeBusinessId: user.businesses[0].id,
        },
      });
      const accessToken = jwt.sign({ userid: user.id }, process.env.JWT_SEC, {
        expiresIn: "3d",
      });

      const { id, businesses, emailVerified, ...filteredUser } = user;
      return res.status(200).json({
        message:
          "User created successfully, please check your email to verify your email",
        user: filteredUser,
        token: accessToken,
      });
    } catch (error) {
      next(error);
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
    // console.log(req.body);

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
          profilePicture: true,
          businesses: true,
          activeBusiness: true,
        },
      });
      // console.log(user);

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
      const accessToken = jwt.sign({ userid: user.id }, process.env.JWT_SEC, {
        expiresIn: "3d",
      });
      return res.status(200).json({
        message: "login successful",
        data: {
          user: {
            email: user.email,
            emailVerified: user.emailVerified,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            activeBusiness: user.activeBusiness,
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
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    try {
      if (!oldPassword) {
        throw new RequiredParameterError("old password");
      }
      if (!newPassword) {
        throw new RequiredParameterError("new password");
      }
      if (!confirmNewPassword) {
        throw new RequiredParameterError("confirm password");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.userId,
        },
      });

      const isPasswordValid = await bcryptjs.compare(
        oldPassword,
        user.password
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError(
          "Old password does not match what is in our database"
        );
      }
      const validateNewPassword = validatePassword(newPassword);
      if (!validateNewPassword) {
        throw new InvalidParameterError(
          "Make sure password length is more than 6, contains a special charcter and at least an uppercase letter"
        );
      }
      if (newPassword === oldPassword) {
        throw new InvalidParameterError(
          "New password and old password are the same"
        );
      }
      if (newPassword !== confirmNewPassword) {
        throw new InvalidParameterError(
          "New password and old password do not match"
        );
      }
      const saltRounds = 10;
      const hashedPassword = await bcryptjs.hash(newPassword, saltRounds);
      await prisma.user.update({
        where: {
          id: req.userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      res.json({ message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  "/verify-email",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.userId) {
        throw new RequiredParameterError("userId");
      }
      if (!req.body.token) {
        throw new RequiredParameterError("pin");
      }
      await prisma.user.update({
        where: {
          email: req.body.userId,
          emailVerification: {
            token: req.body.token,
          },
        },
        data: {
          emailVerified: true,
        },
      });
      await prisma.emailVerificationToken.delete({
        where: {
          token: req.body.token,
        },
      });
      res.json({ message: "email verified successfully" });
    } catch (error) {
      next(error);
    }
  }
);
export default authRouter;
