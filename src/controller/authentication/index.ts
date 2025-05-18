import { Business, Prisma, User } from "@prisma/client";
import { Router, Request, Response } from "express";
import prisma from "../../utils/prisma";
import { validateEmail } from "../../utils/validator/validateEmail";
import { BadRequestError, RequiredParameterError } from "../../errors/appError";
import { validatePassword } from "../../utils/validator/validatePassword";
import * as CryptoJs from "crypto-js";
import * as jwt from "jsonwebtoken";
import * as bcryptjs from "bcryptjs";
import { verifyApiToken } from "../../middleware/verifyToken";

const authRouter = Router();

// authRouter.use(verifyApiToken);
authRouter.post("/register", async (req: Request, res: Response) => {
  const userObj: User = req.body.user;
  const businessDetails: Business = req.body.businessDetails;

  if (!userObj.email) {
    throw new RequiredParameterError("Email");
  }
  if (!userObj.password) {
    throw new RequiredParameterError("Password");
  }
  if (!userObj.firstName) {
    throw new RequiredParameterError("Password");
  }
  if (!userObj.lastName) {
    throw new RequiredParameterError("Password");
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
  try {
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
      const website = await prisma.website.create({
        data: {
          name: "new website",
          businessId: business.id,
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

      const accessToken = jwt.sign({ id: userObj.email }, process.env.JWT_SEC, {
        expiresIn: "3d",
      });
      return {
        user,
        business,
        token: accessToken,
      };
    });

    return res.status(200).json({
      message: "User created successfully",
      ...transactionRes,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
authRouter.post("/login", async (req: Request, res: Response) => {
  const userObj = req.body;
  if (!userObj.email) {
    throw new RequiredParameterError("Email");
  }
  if (!userObj.password) {
    throw new RequiredParameterError("Password");
  }
  const user = await prisma.user.findUnique({
    where: {
      email: userObj.email,
    },
    select: {
      email: true,
      emailVerified: true,
      firstName: true,
      lastName: true,
      password: true,
    },
  });

  if (!user) {
    return res.status(400).json({
      message: "Username or password incorrect",
    });
  }
  const isPasswordValid = await bcryptjs.compare(
    userObj.password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Username or password incorrect",
    });
  }
  const accessToken = jwt.sign({ id: userObj.email }, process.env.JWT_SEC, {
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
      },
      token: accessToken,
    },
  });
});
authRouter.post(
  "/update-password",
  verifyApiToken,
  (req: Request, res: Response) => {
    console.log("logging");
  }
);

export default authRouter;
