import { Router } from "express";
import { getGames, postGames } from "../controllers/gamesController.js";
import validateSchemaGameMiddleware from "../middlewares/validateSchemaGamesMiddleware.js";
import gameSchema from "../schemas/gameSchema.js";

const gamesRouter = Router();

gamesRouter.get("/games", getGames);
gamesRouter.post("/games", validateSchemaGameMiddleware(gameSchema), postGames);

export default gamesRouter;