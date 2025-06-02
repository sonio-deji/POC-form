import {
  StandardResponse,
  SuccessHttpStatusCode,
} from "../../routes/standardResponse";
import prisma from "../../utils/prisma";

export const createNotes = async ({
  businessId,
  title,
  content,
  customerId,
  userId: createdById,
}: {
  title: string;
  content: string;
  customerId?: string;
  businessId: string;
  userId: string;
}) => {
  const note = await prisma.notes.create({
    data: {
      businessId,
      title,
      content,
      customerId,
      createdById,
    },
  });
  const response = new StandardResponse(
    note,
    "Note created successfully.",
    SuccessHttpStatusCode.CREATED
  );
  return response;
};

export const getNotes = async ({
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
  const [notes, totalCount] = await prisma.$transaction([
    prisma.notes.findMany({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            {
              customer: {
                fullName: { contains: search, mode: "insensitive" },
                email: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
      skip,
      take: limit,
    }),
    prisma.notes.count({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            {
              customer: {
                fullName: { contains: search, mode: "insensitive" },
                email: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
    }),
  ]);

  const response = new StandardResponse(
    {
      notes,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    },
    !notes || notes.length === 0
      ? "No notes found."
      : "Notes fetched successfully.",
    SuccessHttpStatusCode.OK
  );

  return response;
};

export const getNoteById = async (noteId: string) => {
  prisma.notes.findUnique({
    where: { id: noteId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
};


export const updateNote = async ({
  noteId,
  title,
  content,
  userId: updatedById,
}: {
  noteId: string;
  title?: string;
  content?: string;
  userId: string;
}) => {
  const note = await prisma.notes.update({
    where: { id: noteId },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      updatedById,
    },
  });
  const response = new StandardResponse(
    note,
    "Note updated successfully.",
    SuccessHttpStatusCode.OK
  );
  return response;
};

export const deleteNote = async (noteId: string, userId: string) => {
  const note = await prisma.notes.delete({
    where: { id: noteId, updatedById: userId},
  });
  if (!note) {
    throw new Error("No note created by this user Found.");
  }
  const response = new StandardResponse(
    note,
    "Note deleted successfully.",
    SuccessHttpStatusCode.OK
  );
  return response;
};

export const getNotesByCustomerId = async ({
  customerId,
  search = "",
  page = 1,
  limit = 10,
}: {
  customerId: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;
  const [notes, totalCount] = await prisma.$transaction([
    prisma.notes.findMany({
      where: {
        customerId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            {
              customer: {
                fullName: { contains: search, mode: "insensitive" },
                email: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.notes.count({
      where: {
        customerId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            {
              customer: {
                fullName: { contains: search, mode: "insensitive" },
                email: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }),
      },
    }),
  ]);
const response = new StandardResponse(
    {
      notes,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    },
    !notes || notes.length === 0
      ? "No notes found."
      : "Notes fetched successfully.",
    SuccessHttpStatusCode.OK
  );

  return response;
};


