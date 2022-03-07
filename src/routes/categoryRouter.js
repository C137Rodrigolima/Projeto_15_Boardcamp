import { Router } from "express";
import { getCategories, postCategory } from "../controllers/categoriesControllers.js";
import validateSchemaCategoryMiddleware from "../middlewares/validateSchemaCategoryMiddleware.js";
import categorySchema from "../schemas/categorySchema.js";

const categoryRouter = Router();

categoryRouter.get("/categories", getCategories);
categoryRouter.post("/categories", validateSchemaCategoryMiddleware(categorySchema), postCategory);

export default categoryRouter;