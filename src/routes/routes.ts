import { Router } from "express";
import authRouter from "../controller/authentication";
import { verifyApiToken } from "../middleware/verifyToken";
import formRouter from "../controller/form";
import { checkEmailVerified } from "../middleware/emailVerified";
import businessRouter from "../controller/business";
import websiteRoute from "../controller/website";
import analytics from "../controller/analytics";
import publicWebsite from "../controller/publicWebsite";
import pageRoutes from "../controller/page";
import invoiceRoutes from "../controller/invoice";
import forgotPassword from "../controller/forgotpassword";
import customerRouter from "../controller/customers";
import socialMediaRoutes from "../controller/socials";

const router = Router();

router.use("/api/user", authRouter);

router.use("/api/form", verifyApiToken, formRouter);

router.use("/api/business", verifyApiToken, checkEmailVerified, businessRouter);

router.use("/api/website", verifyApiToken, checkEmailVerified, websiteRoute);

router.use("/api/analytics", verifyApiToken, checkEmailVerified, analytics);

router.use("/api/publicwebsite", publicWebsite);

router.use("/api/pages", verifyApiToken, checkEmailVerified, pageRoutes);

router.use("/api/invoices", verifyApiToken, checkEmailVerified, invoiceRoutes);

router.use("/api/auth", forgotPassword);

router.use(
  "/api/customers",
  verifyApiToken,
  checkEmailVerified,
  customerRouter
);
router.use(
  "/api/socials",
  verifyApiToken,
  checkEmailVerified,
  socialMediaRoutes
);

export default router;
