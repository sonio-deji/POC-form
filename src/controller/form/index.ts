import { z } from "zod";
import { RequiredParameterError } from "../../errors/appError";
import { validator } from "../../middleware/schemaValidation";
import {
  addFieldSchema,
  formSubmitSchema,
  updateFieldSchema,
  updateFormSchema,
} from "../../utils/schemas";
import {
  addFormField,
  createForm,
  deleteFormField,
  getForm,
  getFormByBusinessId,
  getFormSubmissions,
  getFormWithValues,
  submitForm,
  updateForm,
  updateFormField,
} from "./formActions";
import { Router } from "express";

const formRouter = Router();
formRouter.post(`/create/:pageId`, async (req, res) => {
  const pageId = req.params.pageId;
  const { title, description, fields } = req.body;

  const result = await createForm(title, description, fields, pageId);
  res.json(result);
});

// submit form
formRouter.post(`/submit`, validator(formSubmitSchema), async (req, res, next) => {
  const { formId, responses } = req.body;
  try {
    if (!formId) {
      throw new RequiredParameterError("formId");
    }
    if (!responses) {
      throw new RequiredParameterError("responses");
    }
    const result = await submitForm(formId, responses);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

formRouter.get(`/formvalues`, async (req, res) => {
  const { formId } = req.body;

  const result = await getFormWithValues(formId);
  res.json(result);
});

formRouter.get(`/submissions/:formId`, async (req, res) => {
  const formId = req.params.formId;
  if (!formId) {
    throw new RequiredParameterError("formId");
  }
  const result = await getFormSubmissions(formId);
  res.json(result);
});

formRouter.get(`/getform/:formId`, async (req, res) => {
  const { formId } = req.params;

  const result = await getForm(formId, req.userId);
  res.json(result);
});

// experimental get by businessId
formRouter.get("/", async (req, res, next) => {
  try {
    const { businessId } = req.query;

    const result = await getFormByBusinessId(businessId as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

formRouter.post(`/addform`, async (req, res) => {
  const { formId, formDetails } = req.body;
  const result = await addFormField(formId, formDetails);
  res.json(result);
});

formRouter.patch(
  `/update/:id`,
  validator(updateFormSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const result = await updateForm({ formId: Number(id), ...body });
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      next();
    }
  }
);

// field routes

formRouter.post(
  `/addfield/:formId`,
  validator(addFieldSchema),
  async (req, res, next) => {
    try {
      console.log(req.body);
      const formId = req.params.formId;
      const body = req.body;
      const result = await addFormField(formId, body);
      return res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

formRouter.patch(
  `/updatefield/:id`,
  validator(updateFieldSchema),
  async (req, res, next) => {
    try {
      const fieldId = req.params.id;
      const body = req.body as z.infer<typeof updateFieldSchema>;
      const result = await updateFormField({ fieldId, ...body });
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

formRouter.delete(`/delete/:id`, async (req, res, next) => {
  try {
    const fieldId = req.params.id;
    const result = await deleteFormField(fieldId);
    res.status(result.statusCode || 200).json(result);
  } catch (error) {
    next();
  }
});

// /// /// /// /// /// /// /// /// /// /
export default formRouter;
