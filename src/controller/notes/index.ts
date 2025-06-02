import { Router } from "express";
import { RequiredParameterError } from "../../errors/appError";
import {
  createNotes,
  deleteNote,
  getNotes,
  getNotesByCustomerId,
  updateNote,
} from "./actions";

const notesRouter = Router();

notesRouter.get("/customer/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const { search = "", page = "1", limit = "10" } = req.query;
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    if (!customerId || customerId.length === 0) {
      throw new RequiredParameterError("customerId");
    }

    const response = await getNotesByCustomerId({
      customerId,
      search: search as string,
      page: parsedPage,
      limit: parsedLimit,
    });
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    next(error);
  }
});

notesRouter.get("/", async (req, res, next) => {
  try {
    const { search = "", page = "1", limit = "10" } = req.query;
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    const response = await getNotes({
      businessId: req.businessId,
      search: search as string,
      page: parsedPage,
      limit: parsedLimit,
    });
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    next(error);
  }
});

notesRouter.post("/", async (req, res, next) => {
  try {
    const { customerId, title, content } = req.body;
    if (!customerId || customerId.length === 0) {
      throw new RequiredParameterError("customerId");
    }
    if (!title || title.length === 0) {
      throw new RequiredParameterError("title");
    }
    if (!content || content.length === 0) {
      throw new RequiredParameterError("content");
    }
    const response = await createNotes({
      customerId,
      title,
      content,
      businessId: req.businessId,
      userId: req.userId,
    });
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    next(error);
  }
});

notesRouter.patch("/:noteId", async (req, res, next) => {
  try {
    const noteId = req.params.noteId;
    if (!noteId || noteId.length === 0) {
      throw new RequiredParameterError("noteId");
    }
    const resp = await updateNote({
      noteId,
      ...req.body,
      userId: req.userId,
    });
    res.status(resp.statusCode || 200).json(resp);
  } catch (error) {
    next(error);
  }
});

notesRouter.delete("/:noteId", async (req, res, next) => {
  try {
    const noteId = req.params.noteId;
    if (!noteId || noteId.length === 0) {
      throw new RequiredParameterError("noteId");
    }
    const response = await deleteNote(noteId, req.userId);
    res.status(response.statusCode || 200).json(response);
  } catch (error) {
    next(error);
  }
});

export default notesRouter;
