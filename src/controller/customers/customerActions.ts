import { NotfoundError } from "../../errors/appError";
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
    customer.createdFrom?.responses.forEach((response) => {
      customerInfo[response.field.label] = response.value;
    });

    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      newMessage: customer.newMessage,
      ...customerInfo,
    };
  });

  return {
    data: parsedCustomers,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
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
  return { ...customer, submissions: formattedCustomerSubmissions };
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
      responses: true
    }
  });

  console.log(submission, "submission");

  return customer;
}