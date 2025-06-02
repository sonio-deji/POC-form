import { Worker } from "bullmq";
import { redisConnection } from "../libs/redis";
import { googleTransporter } from "../libs/mailer";
import prisma from "../src/utils/prisma";

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { subject, body, recipients, campaignId, provider, userId } =
      job.data as {
        subject: string;
        body: string;
        recipients: {
          email: string;
          fullName: string;
          id: string;
        }[];
        sendAt: Date;
        campaignId?: string;
        provider: "GOOGLE" | "MICROSOFT";
        userId: string;
      };
    const failedRecipients = [];
    let failedCount = 0;
    let deliveredCount = 0;
    try {
      if (provider === "GOOGLE") {
        const transporter = await googleTransporter(job.data.userId);
        for (const recipient of recipients) {
          try {
            await transporter.sendMail({
              from: `"Your Company"`,
              to: recipient.email,
              subject: subject,
              html: body.replace(/{{customerName}}/g, recipient.fullName),
            });
            deliveredCount++;
          } catch (error) {
            console.error(`Failed to send email to ${recipient.email}:`, error);
            failedRecipients.push(recipient.id);
            failedCount++;
          }
        }
      }
    } catch (error) {
      console.error("Error in email worker:", error);
      throw new Error(`Email worker failed: ${error.message}`);
    }
    // Here you would integrate with an actual email service

    return {
      deliveredCount,
      failedCount,
      failedRecipients,
      campaignId,
    };
  },
  {
    connection: redisConnection,
  }
);

redisConnection.on("connect", () => {
  console.log("✅ Redis connection established");
});

redisConnection.on("ready", () => {
  console.log("🟢 Redis connection is ready to use");
});

emailWorker.on("active", (job) => {
  console.log(`Job ${job.id} is now active`);
});

emailWorker.on("completed", async (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);

  await prisma.campaign.update({
    where: { id: result.campaignId },
    data: {
      status: result.failedCount > 0 ? "FAILED" : "SENT",
      jobId: job.id,
      failedCount: result.failedCount,
      deliveredCount: result.deliveredCount,
      failedRecipients: result.failedRecipients,
      sentAt: new Date(),
    },
  });
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
