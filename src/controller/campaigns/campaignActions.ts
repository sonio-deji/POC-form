import { emailQueue } from "../../../queues/emailQueue";
import { scheduleEmail } from "../../../services/emailScheduler";
import { BadRequestError, NotfoundError } from "../../errors/appError";
import {
  StandardResponse,
  SuccessHttpStatusCode,
} from "../../routes/standardResponse";
import prisma from "../../utils/prisma";

export const createCampaign = async ({
  businessId,
  userId,
  title,
  description,
  body,
  status = "DRAFT",
  scheduledAt,
  recipients,
}: {
  businessId: string;
  userId: string;
  title: string;
  description: string;
  body: string;
  status?: "DRAFT" | "SCHEDULED";
  scheduledAt?: Date;
  recipients: string[];
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      linkedEmailAccount: true,
    },
  });

  let changedToDraft = false;
  if (!user.linkedEmail) {
    status = "DRAFT"; // Default to DRAFT if user has no linked email
    changedToDraft = true;
  }
  const campaign = await prisma.campaign.create({
    data: {
      business: {
        connect: { id: businessId },
      },
      createdBy: {
        connect: { id: userId },
      },
      title,
      description,
      body,
      recipients: {
        connect: recipients.map((id) => ({ id })),
      },
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
    include: {
      recipients: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });
  if (status === "SCHEDULED") {
    await scheduleEmail({
      subject: title,
      body,
      recipients: campaign.recipients,
      sendAt: scheduledAt || new Date(),
      campaignId: campaign.id,
      provider: user.linkedEmailAccount.provider,
      userId: user.id,
    });
  }
  if (changedToDraft) {
    return new StandardResponse({
      campaign,
      message:
        "Campaign created as DRAFT because the user has no linked email.",
      statusCode: 201, // HTTP Status Code for Created
    });
  }
  return new StandardResponse(
    campaign,
    "Campaign created successfully.",
    201 // HTTP Status Code for Created
  );
};

export const getCampaigns = async ({
  businessId,
  search = "",
  page = 1,
  limit = 10,
}: {
  businessId: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;
  const [campaigns, totalCount] = await prisma.$transaction([
    prisma.campaign.findMany({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { body: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      skip,
      take: limit,
    }),
    prisma.campaign.count({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { body: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    }),
  ]);
  const response = new StandardResponse({
    campaigns,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
    message: "Campaigns retrieved successfully.",
    statusCode: SuccessHttpStatusCode.OK, // HTTP Status Code for OK
  });
  return response;
};

export const updateCampaign = async ({
  campaignId,
  userId,
  title,
  description,
  body,
  recipients,
  scheduledAt,
}: {
  campaignId: string;
  userId: string;
  title?: string;
  description?: string;
  body?: string;
  recipients?: string[];
  scheduledAt?: Date;
}) => {
  // find campaign
  // if the campaign has a jobID and has not been sent, cancel the job
  // else do not update the campaign

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      linkedEmailAccount: true,
    },
  });
  let changedToDraft = false;
  if (!user.linkedEmail) {
    changedToDraft = true;
  }
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, createdById: userId },
  });
  if (!campaign) {
    throw new NotfoundError("Campaign not found");
  }
  if (campaign.jobId && campaign.status === "SENT") {
    throw new BadRequestError(
      "Campaign has already been sent and cannot be updated."
    );
  }

  const job = await emailQueue.getJob(campaign.jobId);
  if (job) {
    await job.remove(); // Remove the job if it exists
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(body && { body }),
      updatedBy: {
        connect: { id: userId },
      },
      ...(recipients && {
        recipients: {
          set: [],
          connect: recipients.map((id) => ({ id })),
        },
      }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
    },
    include: {
      recipients: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!changedToDraft && campaign.status === "SCHEDULED") {
    await scheduleEmail({
      subject: title,
      body,
      recipients: updatedCampaign.recipients,
      sendAt: updatedCampaign.scheduledAt || new Date(),
      campaignId: campaign.id,
      provider: user.linkedEmailAccount.provider,
      userId: user.id,
    });
  }

  return new StandardResponse(
    updatedCampaign,
    "Campaign updated successfully.",
    SuccessHttpStatusCode.OK // HTTP Status Code for OK
  );
};

export const deleteCampaign = async (campaignId: string, userId: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, createdById: userId },
  });

  if (!campaign) {
    throw new NotfoundError("Campaign created by user not found.");
  }
  if (campaign.jobId) {
    const job = await emailQueue.getJob(campaign.jobId);
    if (job) {
      await job.remove(); // Remove the job if it exists
    }
  }
  const deletedCampaign = await prisma.campaign.delete({
    where: { id: campaignId },
  });
  return new StandardResponse(
    deletedCampaign,
    "Campaign deleted successfully.",
    SuccessHttpStatusCode.OK // HTTP Status Code for OK
  );
};
