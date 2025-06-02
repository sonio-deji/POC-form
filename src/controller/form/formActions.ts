import { BadRequestError, NotfoundError } from "../../errors/appError";
import {
  StandardResponse,
  SuccessHttpStatusCode,
} from "../../routes/standardResponse";
import prisma from "../../utils/prisma";

export interface IFields {
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "dropdown"
    | "checkbox"
    | "email"
    | "textarea";
  options: string[];
  required: boolean;
  placeholder?: string;
}
export async function getForm(formId: string, userId: string) {
  const form = await prisma.form.findUnique({
    where: {
      id: formId,
      business: {
        userId,
      },
    },
    include: {
      fields: true,
    },
  });

  return form;
}
export async function createForm(
  title: string,
  description: string,
  fields: IFields[],
  businessId: string
) {
  const form = await prisma.form.create({
    data: {
      title,
      businessId,
      description,
      fields: {
        create: fields.map((field) => ({
          label: field.label,
          type: field.type,
          options: field.options,
          required: field.required,
          placeholder: field.placeholder || `Enter ${field.label}`,
        })),
      },
    },
    include: {
      fields: true,
    },
  });
  return form;
}

export async function submitForm(formId: string, responses: any[]) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: { fields: true },
  });

  if (!form) {
    throw new BadRequestError("Form not found");
  }

  const validFieldIds = new Set(form.fields.map((f) => f.id));
  const invalidFieldIds = responses
    .map((r) => r.fieldId)
    .filter((id) => !validFieldIds.has(id));

  if (invalidFieldIds.length > 0) {
    throw new BadRequestError(
      `Invalid fieldId(s) in responses: ${invalidFieldIds.join(", ")}`
    );
  }

  const nameField = form.fields.find((f) => f.label.toLowerCase() === "name");
  const emailField = form.fields.find((f) => f.label.toLowerCase() === "email");

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

  const existingCustomer = await prisma.customer.findFirst({
    where: { email: emailResponse.value },
    include: {
      createdFrom: {
        include: {
          responses: true,
        },
      },
    },
  });

  const submission = await prisma.$transaction(async (tx) => {
    let customer = existingCustomer;

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          email: emailResponse.value,
          fullName: nameResponse.value,
          newMessage: true,
          businessId: form.businessId,
        },
        include: {
          createdFrom: {
            include: {
              responses: true,
            },
          },
        },
      });
    } else {
      const newResponses = [];
      responses.forEach((response) => {
        const existingResponse = existingCustomer.createdFrom.responses.find(
          (r) => r.fieldId === response.fieldId
        );
        if (!existingResponse) {
          newResponses.push({
            fieldId: response.fieldId,
            value: response.value,
          });
        }
      })
    
      if (newResponses.length > 0) {
        await tx.submission.update({
          where: { id: existingCustomer.createdFromId },
          data: {
            responses: {
              create: newResponses.map(({ fieldId, value }) => ({
                fieldId,
                value,
              })),
            },
          },
        });
      }
    }

    const submission = await tx.submission.create({
      data: {
        formId,
        responses: {
          create: responses.map(({ fieldId, value }) => ({
            fieldId,
            value,
          })),
        },
        customerId: customer.id,
      },
      include: { responses: true },
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        newMessage: true,
        createdFromId: existingCustomer?.createdFromId ?? submission.id,
      },
    });

    return submission;
  });

  return submission;
}

export async function getFormWithValues(formId: string) {
  const formWithValues = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      fields: {
        include: {
          responses: {
            where: {
              submission: {
                formId: formId,
              },
            },
            select: {
              value: true,
            },
          },
        },
      },
    },
  });

  return formWithValues;
}

export async function getFormSubmissions(formId: string) {
  const submissions = await prisma.submission.findMany({
    where: { formId },
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
  });

  const formattedSubmissions = submissions.map((submissions) => {
    const object: any = {
      response: {},
    };
    object.id = submissions.id;
    object.formId = submissions.formId;
    object.submittedAt = submissions.submittedAt;
    submissions.responses.forEach((response) => {
      console.log(response.field.label, response.value, "response");
      object.response[response.field.label] = response.value || "";
    });
    return object;
  });

  return formattedSubmissions;
}
export async function updateForm({
  formId,
  title,
  description,
  fields,
}: {
  formId: string;
  title: string;
  description: string;
  fields: {
    id: number;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
  }[];
}) {
  const updatedForm = await prisma.form.update({
    where: { id: formId },
    data: {
      ...(title && { title }),
      ...(description && { description }),
    },
    include: {
      fields: true,
    },
  });
  const response = new StandardResponse(
    updatedForm,
    "Form updated successfully",
    SuccessHttpStatusCode.OK
  );
  return response;
}

export async function addFormField(
  formId: string,
  fieldData: {
    label: string;
    type:
      | "text"
      | "number"
      | "date"
      | "dropdown"
      | "checkbox"
      | "email"
      | "textarea";
    options?: string[];
    required?: boolean;
    placeholder?: string;
  }
) {
  const field = await prisma.field.create({
    data: {
      formId,
      label: fieldData.label,
      type: fieldData.type,
      options: fieldData.options || [],
      required: fieldData.required || false,
      placeholder: fieldData.placeholder || "",
    },
  });

  const response = new StandardResponse(
    field,
    "Field added successfully",
    SuccessHttpStatusCode.OK
  );

  return response;
}

export async function deleteFormField(fieldId: string) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
  });

  if (!field) {
    throw new Error(`Field with ID ${fieldId} does not exist`);
  }

  const deletedField = await prisma.field.delete({
    where: { id: fieldId },
  });

  const response = new StandardResponse(
    deletedField,
    "Field deleted successfully",
    SuccessHttpStatusCode.OK
  );
  return response;
}

export async function updateFormField({
  fieldId,
  label,
  required,
  options,
  placeholder,
}: {
  fieldId: string;
  label?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
  });
  if (!field) {
    throw new NotfoundError("Field not found");
  }
  const updatedField = await prisma.field.update({
    where: { id: fieldId },
    data: {
      ...(label && { label }),
      ...(required && { required }),
      ...(options && { options }),
      ...(placeholder && { placeholder }),
    },
  });

  const response = new StandardResponse(
    updatedField,
    "Field updated successfully",
    SuccessHttpStatusCode.OK
  );
  return response;
}

export async function getFormByBusinessId(businessId: string) {
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
  const response = new StandardResponse(
    form,
    "Form found successfully.",
    SuccessHttpStatusCode.OK
  );
  return response;
}
