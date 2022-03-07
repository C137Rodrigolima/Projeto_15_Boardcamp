import { Router } from "express";
import { getCategories, postCategory } from "../controllers/categoriesControllers.js";

const categoryRouter = Router();

categoryRouter.get("/categories", getCategories);
categoryRouter.post("/categories", postCategory);

export default categoryRouter;