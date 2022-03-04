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
        SELECT * FROM categories;
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
        return res.sendStatus(400);
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
        res.sendStatus(500).send(error);
    }
});

app.get("/games", async (req, res) => {
    const myQuery = req.query.name;
    console.log("minha query: " + myQuery);

    try {
        let allGames;
        if(!myQuery){
            allGames = await connection.query(`
            SELECT games.*, categories.name AS "categoryName" 
            FROM games 
            JOIN categories ON games."categoryId"=categories.id;
        `);
        } else {
            allGames = await connection.query(`
                SELECT games.*, categories.name AS "categoryName" 
                FROM games 
                JOIN categories ON games."categoryId"=categories.id
                WHERE games.name LIKE '%'||$1||'%';
            `, [myQuery]);
        }
        res.send(allGames.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post("/games", async (req,res)=>{
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;

    if(name === "" || stockTotal <=0 || pricePerDay <=0){
        return res.sendStatus(400);
    }

    try {
        const existentIDCategory = await connection.query(`
            SELECT * FROM categories
            WHERE id= $1
        `, [categoryId]);
        if(existentIDCategory.rows.length === 0){
            return res.sendStatus(404);
        }
        const existentGame = await connection.query(`
            SELECT * FROM games
            WHERE name = $1
        `, [name]);
        if(existentGame.rows.length !== 0){
            return res.sendStatus(409);
        }

        await connection.query(`
            INSERT INTO games 
                (name, image, "stockTotal", "categoryId", "pricePerDay")
            VALUES
                ($1, $2, $3, $4, $5);
        `, [name, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500).send(error);
    }
});

app.get("/customers", async (req, res) => {
    const {cpf} = req.query;
    try {
        let customersList;
        if(!cpf){
            customersList = await connection.query(`
            SELECT * FROM customers;
            `);
        } else{
            customersList = await connection.query(`
                SELECT * FROM customers WHERE cpf LIKE '%'||$1||'%';
            `, [cpf]);
        }
        res.send(customersList.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get("/customers/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const customer = await connection.query(`
            SELECT * FROM customers
            WHERE id=$1;
        `, [id]);
        if(customer.rows.length === 0){
            return res.sendStatus(404);
        }

        res.send(customer.rows[0]);
    } catch (error) {
        res.sendStatus(error);
    }
});

app.post("/customers", async (req, res) => {
    const {
        name, phone, cpf, birthday
    } = req.body;
    try {
        const existentCustumer = await connection.query(`
            SELECT * FROM customers
            WHERE cpf = $1;
        `, [cpf]);
        if(existentCustumer.rows.length !== 0){
            return res.sendStatus(409);
        }

        await connection.query(`
            INSERT INTO customers (name, phone, cpf, birthday)
            VALUES ($1, $2, $3, $4);
        `, [name, phone, cpf, birthday]);
        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.put("/customers/:id", async (req, res) => {
    const {id} = req.params;
    const {name, phone, cpf, birthday} = req.body;
    try {
        const existentCustumer = await connection.query(`
            SELECT * FROM customers
            WHERE cpf = $1;
        `, [cpf]);
        if(existentCustumer.rows.length !== 0){
            return res.sendStatus(409);
        }

        await connection.query(`
            UPDATE customers SET 
                name=$1, phone=$2, cpf=$3, birthday=$4
            WHERE id=$5;
        `, [name, phone, cpf, birthday, id]);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.listen(4000, ()=> console.log('Listening on Port 4000'));