import { emailQueue } from "../queues/emailQueue"; 
import prisma from "../src/utils/prisma";

export async function scheduleEmail(
  data: {
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
    failedRecipients?: string[];
  },
  failedOnly = false
) {
  if (failedOnly) {
    const recepients = data.recipients.filter((recipient) =>
      data.failedRecipients.includes(recipient.id)
    );
    if (recepients.length === 0) {
      console.log("No failed recipients to schedule email for.");
      return;
    }
    data.recipients = recepients;
  }
  console.log("Scheduling email with data:", data);
  const delay =
    data.sendAt.getTime() > Date.now() ? data.sendAt.getTime() - Date.now() : 0;
  const job = await emailQueue.add(
    "send-email",
    {
      ...data,
    },
    {
      delay: delay,
      removeOnComplete: true,
      attempts: 3,
    }
  );
  console.log(`Email scheduled with job ID: ${job.id}`);

  if (data.campaignId) {
    await prisma.campaign.update({
      where: { id: data.campaignId },
      data: {
        status: "SCHEDULED",
        scheduledAt: data.sendAt,
        jobId: job.id,
      },
    });
    console.log(`Campaign ${data.campaignId} status updated to SCHEDULED`);
  }

  return job;
}
