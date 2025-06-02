import { Router } from "express";
import { RequiredParameterError } from "../../errors/appError";
import {
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "./customerActions";

const customerRouter = Router();

customerRouter.get("/", async (req, res, next) => {
  try {
    const businessId = req.businessId;
    const { search = "", page = "1", limit = "10" } = req.query;

    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);

    const customers = await getCustomers({
      businessId: String(businessId),
      search: String(search),
      page: parsedPage,
      limit: parsedLimit,
    });
    res.status(customers.statusCode || 200).json(customers);
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

customerRouter.delete("/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId || customerId.length === 0) {
      throw new RequiredParameterError("customerId");
    }

    const result = await deleteCustomer(customerId);
    res.json({ message: "Customer deleted successfully", customer: result });
  } catch (error) {
    next(error);
  }
});

export default customerRouter;

// updating a user basically updates the original form submission
// then if the formFields being submitted include the email and name, update the customer object also
