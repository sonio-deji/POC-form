import { Router } from "express";
import {
  InvalidParameterError,
  RequiredParameterError,
} from "../../errors/appError";
import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  updateCampaign,
} from "./campaignActions";

const campaignRouter = Router();

campaignRouter.post("/", async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const userId = req.userId;
    const requiredFields = [
      "title",
      "description",
      "content",
      "recipients",
      "sendTime",
    ];
    const {
      title,
      description,
      content: body,
      status = "DRAFT",
      sendTime,
      recipients,
    } = req.body;
    if (req.body.recipients && !Array.isArray(req.body.recipients)) {
      throw new InvalidParameterError("recipients must be an array");
    }
    if (sendTime && isNaN(new Date(sendTime).valueOf())) {
      throw new InvalidParameterError("sendTime must be a valid date string");
    }
    if (status && !["DRAFT", "SCHEDULED"].includes(status)) {
      throw new InvalidParameterError(
        "status must be either DRAFT or SCHEDULED"
      );
    }

    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].length === 0) {
        throw new RequiredParameterError(field);
      }
    }

    const response = await createCampaign({
      businessId,
      userId,
      title,
      description,
      body,
      status,
      scheduledAt: sendTime ? new Date(sendTime) : null,
      recipients,
    });
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

campaignRouter.get("/", async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { search = "", page = "1", limit = "10" } = req.query;
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);

    if (!businessId || businessId.length === 0) {
      throw new RequiredParameterError("businessId");
    }
    const response = await getCampaigns({
      businessId,
      search: search as string,
      page: parsedPage,
      limit: parsedLimit,
    });
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    next(error);
  }
});

campaignRouter.patch("/:campaignId", async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const userId = req.userId;

    if (req.body.scheduleAt && isNaN(new Date(req.body.scheduleAt).valueOf())) {
      throw new InvalidParameterError("sendTime must be a valid date string");
    }

    if (!campaignId || campaignId.length === 0) {
      throw new RequiredParameterError("campaignId");
    }

    const resp = await updateCampaign({
      campaignId,
      userId,
      ...req.body,
    });
    res.status(resp.statusCode || 200).json(resp);
  } catch (error) {
    next(error);
  }
});

campaignRouter.delete("/:campaignId", async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    if (!campaignId || campaignId.length === 0) {
      throw new RequiredParameterError("campaignId");
    }
    const resp = await deleteCampaign(campaignId, req.userId);
    res.status(resp.statusCode || 200).json(resp);
  } catch (error) {
    next(error);
  }
});

export default campaignRouter;
