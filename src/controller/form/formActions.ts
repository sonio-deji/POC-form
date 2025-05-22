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
    include: {
      fields: true,
    },
  });

  if (!form) {
    throw new Error("Form not found");
  }
  const nameField = form.fields.find((field) => field.label === "name");
  if (!nameField) {
    throw new Error("Name field not found");
  }
  const emailField = form.fields.find((field) => field.label === "email");
  if (!emailField) {
    throw new Error("Email field not found");
  }
  const nameResponse = responses.find(
    (response) => response.fieldId === nameField.id
  );
  const emailResponse = responses.find(
    (response) => response.fieldId === emailField.id
  );
  if (!nameResponse) {
    throw new Error("Name response not found");
  }
  if (!emailResponse) {
    throw new Error("Email response not found");
  }
  if (!nameResponse.value) {
    throw new Error("Name value is required");
  }
  if (!emailResponse.value) {
    throw new Error("Email value is required");
  }
  const existingCustomer = await prisma.customer.findFirst({
    where: { email: emailResponse.value },
  });

  const result = await prisma.$transaction(async (tx) => {
    let customer = existingCustomer;

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          email: emailResponse.value,
          fullName: nameResponse.value,
          newMessage: true,
          businessId: form.businessId, // you may want to pass this in
        },
      });
    }

    const submission = await tx.submission.create({
      data: {
        formId,
        responses: {
          create: responses.map((response) => ({
            fieldId: response.fieldId,
            value: response.value,
          })),
        },
        customerId: customer.id,
      },
      include: {
        responses: true,
      },
    });

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        newMessage: true,
        createdFromId: submission.id,
      },
    });

    return submission;
  });

  return result;
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
      // object.response[response.field.label].value = response.value;
      // object.response[response.field.label].label = response.field.label;
    });
    console.log(object, "object");
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
