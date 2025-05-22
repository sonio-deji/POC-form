import { Router } from "express";
import { RequiredParameterError } from "../../errors/appError";
import { getCustomerById, getCustomers, updateCustomer } from "./customerActions";

const customerRouter = Router();

customerRouter.get("/:businessId", async (req, res, next) => {
  try {
    const businessId = req.params.businessId;
    const { search = "", page = "1", limit = "10" } = req.query;
    if (!businessId) {
      throw new RequiredParameterError("businessId");
    }

    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);

    const customers = await getCustomers({ businessId: String(businessId) });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

customerRouter.get("/getByID/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId || customerId.length === 0) {
      throw new RequiredParameterError("customerId");
    }
    const customer = await getCustomerById(customerId);
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

customerRouter.put("/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId || customerId.length === 0) {
      throw new RequiredParameterError("customerId");
    }
    const { formId, responses } = req.body;
    if (!formId) {
      throw new RequiredParameterError("formId");
    }
    if (!responses) {
      throw new RequiredParameterError("responses");
    }
    const result = await updateCustomer(customerId, responses);
    res.json({ message: "Customer updated", customer: result });
  } catch (error) {
    next(error);
  }
});

export default customerRouter;


// updating a user basically updates the original form submission
// then if the formFields being submitted include the email and name, update the customer object also