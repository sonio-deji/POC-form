import { Router, Request, Response, NextFunction } from "express";
import prisma from "../../utils/prisma";
import crypto from "crypto";
import { RequiredParameterError } from "../../errors/appError";
import * as bcryptjs from "bcryptjs";

const forgotPassword = Router();

forgotPassword.post(
  "/forgot-password",
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    try {
      if (!email) {
        throw new RequiredParameterError("email");
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(200).json({ message: "Check your email" });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 15);

      await prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expiresAt: expires },
        create: {
          userId: user.id,
          token,
          expiresAt: expires,
        },
      });
      const resetUrl = `https://yourapp.com/reset-password?token=${token}`;
      console.log(resetUrl); // for development

      res.json({ message: "Reset link sent" });
    } catch (error) {
      next(error);
    }
  }
);

forgotPassword.post(
  "/reset-password",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        throw new RequiredParameterError("token");
      }
      if (!newPassword) {
        throw new RequiredParameterError("new password");
      }
      const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!record || record.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      });

      await prisma.passwordResetToken.delete({ where: { token } });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  }
);

// export { forgotPassword };
export default forgotPassword;
