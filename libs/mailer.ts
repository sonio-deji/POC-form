import nodemailer from "nodemailer";
import prisma from "../src/utils/prisma";
import { decrypt } from "../src/utils/cryptoJs";

export const googleTransporter = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      linkedEmailAccount: true,
    },
  });
  console.log(user.linkedEmailAccount)
  if (!user) {
    throw new Error("User not found");
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: user.email,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: decrypt(user.linkedEmailAccount.refreshToken),
      accessToken: decrypt(user.linkedEmailAccount.accessToken),
    },
  });
  return transporter;
};
