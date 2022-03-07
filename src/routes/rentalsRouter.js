import { Router } from "express";
import {deleteRent, finalizeRent, getRentals, postRentals} from "../controllers/rentalsController.js";
import validateSchemaRentalsMiddleware from "../middlewares/validateSchemaRentalsMiddleware.js";
import rentalsSchema from "../schemas/rentalsSchema.js";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", getRentals);
rentalsRouter.post("/rentals", validateSchemaRentalsMiddleware(rentalsSchema), postRentals);
rentalsRouter.post("/rentals/:id/return", finalizeRent);
rentalsRouter.delete("rentals/:id", deleteRent);

export default rentalsRouter;