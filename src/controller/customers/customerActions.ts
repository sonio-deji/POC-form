import { BadRequestError, NotfoundError } from "../../errors/appError";
import { StandardResponse } from "../../routes/standardResponse";
import prisma from "../../utils/prisma";

interface GetCustomersOptions {
  businessId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getCustomers = async ({
  businessId,
  search,
  page = 1,
  limit = 10,
}: GetCustomersOptions) => {
  const skip = (page - 1) * limit;

  const form = await prisma.form.findFirst({
    where: { businessId },
    include: {
      fields: {
        select: {
          id: true,
          label: true,
          options: true,
          required: true,
          type: true,
          placeholder: true,
          displayField: true,
        },
      },
    },
  });
  if (!form) {
    throw new NotfoundError("Form not found");
  }

  const [customers, totalCount] = await prisma.$transaction([
    prisma.customer.findMany({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        newMessage: true,
        createdFrom: {
          select: {
            responses: {
              include: {
                field: true,
              },
            },
          },
        },
      },
    }),
    prisma.customer.count({
      where: {
        businessId,
        ...(search && {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    }),
  ]);
  const parsedCustomers = customers.map((customer) => {
    const customerInfo: Record<string, string> = {};

    // customer.createdFrom?.responses.forEach((response) => {
    //   customerInfo[response.field.label] = response.value;
    // });
    form.fields.forEach((field) => {
      const response = customer.createdFrom?.responses.find(
        (response) => response.field.id === field.id
      );
      if (response) {
        customerInfo[field.label] = response.value;
      } else {
        customerInfo[field.label] = "";
      }
    });

    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      newMessage: customer.newMessage,
      ...customerInfo,
    };
  });
  const response = new StandardResponse(
    {
      customers: parsedCustomers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    },
    parsedCustomers.length === 0
      ? "No customers found"
      : "Customers fetched successfully"
  );

  return response;
};

export const getCustomerById = async (customerId: string) => {
  const [_, customer] = await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { newMessage: false },
    }),

    prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        newMessage: true,
        invoices: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        submissions: {
          include: {
            responses: {
              select: {
                id: true,
                value: true,
                field: {
                  select: {
                    label: true,
                    type: true,
                    id: true,
                  },
                },
              },
            },
          },
          take: 5,
        },
      },
    }),
  ]);

  if (!customer) {
    throw new NotfoundError("Customer does not exist");
  }

  const formattedCustomerSubmissions = customer.submissions.map(
    (submissions) => {
      const object: any = {
        response: {},
      };
      object.id = submissions.id;
      object.formId = submissions.formId;
      object.submittedAt = submissions.submittedAt;
      submissions.responses.forEach((response) => {
        object.response[response.field.label] = response.value || "";
      });
      return object;
    }
  );
  const response = new StandardResponse(
    {
      ...customer,
      submissions: formattedCustomerSubmissions,
    },
    "Customer fetched successfully"
  )
  return response;
};

export const updateCustomer = async (customerId: string, responses: any[]) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!customer) {
    throw new NotfoundError("Customer does not exist");
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id: customer.createdFromId,
    },
    include: {
      responses: true,
      form: {
        include: {
          fields: true,
        },
      },
    },
  });

  if (!submission) {
    throw new NotfoundError("Customer Submission does not exist");
  }

  const validFieldIds = new Set(submission.form.fields.map((f) => f.id));
  const invalidFieldIds = responses
    .map((r) => r.fieldId)
    .filter((id) => !validFieldIds.has(id));

  if (invalidFieldIds.length > 0) {
    throw new BadRequestError(
      `Invalid fieldId(s) in responses: ${invalidFieldIds.join(", ")}`
    );
  }

  const nameField = submission.form.fields.find(
    (f) => f.label.toLowerCase() === "name"
  );
  const emailField = submission.form.fields.find(
    (f) => f.label.toLowerCase() === "email"
  );

  if (!nameField || !emailField) {
    throw new BadRequestError(
      "Required fields 'name' and/or 'email' not found in the form"
    );
  }

  const nameResponse = responses.find((r) => r.fieldId === nameField.id);
  const emailResponse = responses.find((r) => r.fieldId === emailField.id);

  if (!nameResponse?.value) {
    throw new BadRequestError("Name value is required");
  }

  if (!emailResponse?.value) {
    throw new BadRequestError("Email value is required");
  }

  const existingResponses = submission.responses;

  const updatedCustomer = await prisma.$transaction(async (tx) => {
    responses.map(async (res) => {
      const existing = existingResponses.find((r) => r.fieldId === res.fieldId);
      await tx.response.upsert({
        where: {
          id: existing?.id || -1,
          submissionId: submission.id,
        },
        create: {
          fieldId: res.fieldId,
          value: res.value,
          submissionId: submission.id,
        },
        update: {
          value: res.value,
        },
      });
    });

    // Update customer
    const updatedCustomer = await tx.customer.update({
      where: { id: customerId },
      data: {
        email: emailResponse.value,
        fullName: nameResponse.value,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        newMessage: true,
        createdFrom: {
          select: {
            responses: {
              include: {
                field: true,
              },
            },
          },
        },
      },
    });

    return updatedCustomer;
  });

  const customerInfo: Record<string, string | boolean> = {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    newMessage: customer.newMessage,
  };

  updatedCustomer.createdFrom?.responses.forEach((response) => {
    customerInfo[response.field.label] = response.value;
  });
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    newMessage: customer.newMessage,
    ...customerInfo,
  };
};

export const deleteCustomer = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!customer) {
    throw new NotfoundError("Customer does not exist");
  }

  await prisma.customer.delete({
    where: {
      id: customerId,
    },
  });

  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    newMessage: customer.newMessage,
  };
};
