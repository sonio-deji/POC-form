import { BadRequestError } from "../../errors/appError";
import prisma from "../../utils/prisma";

export interface IFields {
  label: string;
  type: "email" | "text" | "multi-select";
  options: string[];
  required: boolean;
}
export async function getForm(formId: number) {
  const form = await prisma.form.findUnique({
    where: { id: formId },
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
        })),
      },
    },
    include: {
      fields: true,
    },
  });
  return form;
}


export async function submitForm(formId: number, responses: any[]) {
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
      });
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

export async function getFormWithValues(formId: number) {
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

export async function getFormSubmissions(formId: number) {
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
export async function updateForm(
  formId: number,
  title: string,
  description: string,
  fields: any[]
) {
  const updatedForm = await prisma.form.update({
    where: { id: formId },
    data: {
      title,
      description,
      fields: {
        deleteMany: {},
        create: fields.map((field) => ({
          label: field.label,
          type: field.type,
          options: field.options,
          required: field.required,
        })),
      },
    },
    include: {
      fields: true,
    },
  });
  return updatedForm;
}

export async function addFormField(
  formId: number,
  fieldData: {
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
  }
) {
  const field = await prisma.field.create({
    data: {
      formId,
      label: fieldData.label,
      type: fieldData.type,
      options: fieldData.options,
      required: fieldData.required || false,
    },
  });

  return field;
}

export async function deleteFormField(fieldId: number) {
  const field = await prisma.field.findUnique({
    where: { id: fieldId },
  });

  if (!field) {
    throw new Error(`Field with ID ${fieldId} does not exist`);
  }

  const deletedField = await prisma.field.delete({
    where: { id: fieldId },
  });

  return deletedField;
}
