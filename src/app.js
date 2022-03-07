import Express, {json} from "express";
import cors from "cors";
import connection from "./database/index.js";
import router from "./routes/index.js";
import dayjs from "dayjs";
import dotenv from 'dotenv';
dotenv.config();

const app = Express();
app.use(cors());
app.use(json());

app.use(router);

app.listen(4000, ()=> console.log('Listening on Port 4000'));