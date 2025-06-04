import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import {
  InvalidParameterError,
  RequiredParameterError,
  UnauthorizedError,
} from "../../errors/appError";
import { validatePassword } from "../../utils/validator/validatePassword";
import * as bcryptjs from "bcryptjs";
import { validateEmail } from "../../utils/validator/validateEmail";

const user = Router();

user.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

user.put("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;
    const user = await prisma.user.update({
      where: {
        id: req.id,
      },
      data: {
        firstName,
        lastName,
        profilePicture,
      },
    });

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
});

user.post(
  "/update-password",
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

user.get(
  "/details",
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId;

    try {
      const details = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phoneNumber: true,
          firstName: true,
          lastName: true,
          activeBusiness: {
            select: {
              id: true,
              businessName: true,
              description: true,
              addressLineOne: true,
              addressLineTwo: true,
              businessEmail: true,
              country: true,
              state: true,
              city: true,
              postalCode: true,
            },
          },
        },
      });
      res.json({ businessDetails: details });
    } catch (error) {
      next(error);
    }
  }
);

user.put(
  "/details/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        firstName,
        lastName,
        phoneNumber,
        businessEmail,
        description,
        addressLineOne,
        addressLineTwo,
        city,
        postalCode,
        state,
        country,
      } = req.body;
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: req.userId,
          },
          data: {
            firstName,
            lastName,
            phoneNumber,
          },
        });

        if (businessEmail) {
          validateEmail(businessEmail);
        }
        await tx.business.update({
          where: {
            id: req.params.id,
            userId: req.userId,
          },
          data: {
            description,
            addressLineOne,
            addressLineTwo,
            city,
            postalCode,
            state,
            country,
            businessEmail,
          },
        });
      });
      res.json({ message: "Details updated successfully" });
    } catch (error) {
      next(error);
    }
  }
);
user.get(
  "/get-user-subscription",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const active = await prisma.userSubscription.findFirst({
        where: {
          userId: req.userId,
          startDate: { lte: now },
          endDate: { gte: now },
          status: "active",
        },
        include: { subscription: true },
      });

      res.json(active || { message: "No active subscription" });
    } catch (error) {
      next(error);
    }
  }
);
export default user;
