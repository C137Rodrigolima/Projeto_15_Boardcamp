import { Router } from "express";
import { getCustomers, getCustomersbyId, postCustomers, putCustomers } from "../controllers/customersController.js";

const customersRouter = Router();

customersRouter.get("/customers", getCustomers);
customersRouter.get("/customers/:id", getCustomersbyId);
customersRouter.post("/customers", postCustomers);
customersRouter.put("/customers/:id", putCustomers);

export default customersRouter;