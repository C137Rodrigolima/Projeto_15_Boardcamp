import Express, {json} from "express";
import cors from "cors";
import connection from "./database/index.js";
import dotenv from 'dotenv';
dotenv.config();

const app = Express();
app.use(cors());
app.use(json());

app.get("/categories", async (req, res) =>{
    try {
        const allCategories = await connection.query(`
        SELECT * FROM categories
        `)
        res.send(allCategories.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post("/categories", async (req, res) => {
    const {name} = req.body;
    if(name === ""){
        return res.sendStatus(400)
    }
    try {
        const existentCategorie = await connection.query(`
            SELECT * FROM categories WHERE name=$1
        `, [name]);
        if(existentCategorie.rows.length !== 0){
            return res.sendStatus(409);
        }
        const addCategorie = await connection.query(`
            INSERT INTO categories (name) VALUES ($1);
        `, [name]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

app.listen(4000, ()=> console.log('Listening on Port 4000'));