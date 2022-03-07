import { Router } from "express";
import {deleteRent, finalizeRent, getRentals, postRentals} from "../controllers/rentalsController.js";

const rentalsRouter = Router();

rentalsRouter.get("/rentals", getRentals);
rentalsRouter.post("/rentals", postRentals);
rentalsRouter.post("/rentals/:id/return", finalizeRent);
rentalsRouter.delete("rentals/:id", deleteRent);

export default rentalsRouter;