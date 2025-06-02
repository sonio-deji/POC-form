import { z } from "zod";

export const updateFormSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export const addFieldSchema = z.object({
  label: z
    .string({ required_error: "Label is required" })
    .min(3, { message: "Label must be at least 3 characters long" }),
  type: z.enum([
    "text",
    "number",
    "date",
    "dropdown",
    "checkbox",
    "email",
    "textarea",
  ]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
});

export const updateFieldSchema = z.object({
  label: z
    .string()
    .min(3, { message: "Label must be at least 3 characters long" })
    .optional(),
  type: z
    .enum([
      "text",
      "number",
      "date",
      "dropdown",
      "checkbox",
      "email",
      "textarea",
    ])
    .optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
});

export const formSubmitSchema = z.object({
  formId: z.string(),
  responses: z.array(
    z.object({
      fieldId: z.string(),
      value: z.string(),
    })
  ),
});
