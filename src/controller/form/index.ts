import {
  addFormField,
  createForm,
  deleteFormField,
  getForm,
  getFormWithValues,
  submitForm,
} from "./formActions";
import { Router } from "express";

const formRouter = Router();
formRouter.post(`/create/:pageId`, async (req, res) => {
  const pageId = req.params.pageId;
  const { title, description, fields } = req.body;

  const result = await createForm(title, description, fields, pageId);
  res.json(result);
});
formRouter.post(`/submit`, async (req, res) => {
  const { formId, responses } = req.body;

  const result = await submitForm(Number(formId), responses);
  res.json(result);
});

formRouter.get(`/formvalues`, async (req, res) => {
  const { formId } = req.body;

  const result = await getFormWithValues(formId);
  res.json(result);
});
formRouter.get(`/getform`, async (req, res) => {
  const { formId } = req.body;

  const result = await getForm(formId);
  res.json(result);
});
formRouter.post(`/addform`, async (req, res) => {
  const { formId, formDetails } = req.body;
  console.log(formId, "formId");
  console.log(formDetails, "form details");
  const result = await addFormField(formId, formDetails);
  res.json(result);
});
formRouter.delete(`/delete/:id`, async (req, res) => {
  const fieldId = parseInt(req.params.id, 10);
  console.log(fieldId);
  const result = await deleteFormField(fieldId);
  res.json(result);
});

export default formRouter;
