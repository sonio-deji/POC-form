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
  const submission = await prisma.submission.create({
    data: {
      formId,
      responses: {
        create: responses.map((response) => ({
          fieldId: response.fieldId,
          value: response.value,
        })),
      },
    },
    include: {
      responses: true,
    },
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
