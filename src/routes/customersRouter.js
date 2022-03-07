import { Router } from "express";
import { getCustomers, getCustomersbyId, postCustomers, putCustomers } from "../controllers/customersController.js";
import validateSchemaCustomerMiddleware from "../middlewares/validateSchemaCustomerMiddleware.js";
import customerSchema from "../schemas/customerSchema.js";

const customersRouter = Router();

customersRouter.get("/customers", getCustomers);
customersRouter.get("/customers/:id", getCustomersbyId);
customersRouter.post("/customers", validateSchemaCustomerMiddleware(customerSchema), postCustomers);
customersRouter.put("/customers/:id", validateSchemaCustomerMiddleware(customerSchema), putCustomers);

export default customersRouter;