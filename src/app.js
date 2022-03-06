import Express, {json} from "express";
import cors from "cors";
import connection from "./database/index.js";
import dayjs from "dayjs";
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
        res.sendStatus(500);
    }
});

app.get("/games", async (req, res) => {
    const myQuery = req.query.name;

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
        const existentCustomer = await connection.query(`
            SELECT * FROM customers
            WHERE cpf = $1;
        `, [cpf]);
        if(existentCustomer.rows.length !== 0){
            return res.sendStatus(400);
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
        const existentCustomer = await connection.query(`
            SELECT * FROM customers
            WHERE cpf = $1;
        `, [cpf]);
        if(existentCustomer.rows.length !== 0){
            return res.sendStatus(400);
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

app.get("/rentals", async (req, res) => {
    try {
        const allRentals = await connection.query(`
            SELECT * FROM rentals;
        `);
        res.send(allRentals.rows);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/rentals", async (req, res) => {
    const {customerId, gameId, daysRented} = req.body;
    const date = dayjs().format("YYYY-MM-DD");

    try {
        const existentCustomer = await connection.query(`
            SELECT * FROM customers WHERE id = $1;
        `, [customerId]);
        const existentGame = await connection.query(`
            SELECT * FROM games WHERE id = $1;
        `, [gameId]);
        if(
        existentCustomer.rows.length === 0 || 
        existentGame.rows.length === 0 || 
        daysRented <= 0){
            return res.sendStatus(400);
        }

        const gameStockNumber = existentGame.rows[0].stockTotal;

        const existentRentals = await connection.query(`
            SELECT * FROM rentals
            WHERE "gameId" = $1;
        `, [gameId]);
        // needed to select  AND "returnDate" = NULL to count the correct number of rentals;

        if(existentRentals.rows.length >= gameStockNumber){
            return res.sendStatus(400);
        }

        const price = daysRented * (existentGame.rows[0].pricePerDay);
        
        await connection.query(`
            INSERT INTO rentals
                ("customerId", 
                "gameId", 
                "rentDate",
                "daysRented", 
                "returnDate", 
                "originalPrice", 
                "delayFee")
            VALUES
                ($1, $2, $3, $4, NULL, $5, NULL);
        `, [customerId, gameId, date, daysRented, price]);

        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.delete("/rentals/:id", async (req, res) => {
    const {id} = req.params;
    try {
        const existentRentals = await connection.query(`
            SELECT * FROM rentals WHERE id = $1;
        `, [id]);
        if(existentRentals.rows.length === 0){
            return res.sendStatus(404);
        } else if (existentRentals.rows.returnDate !== null){
            return res.sendStatus(400);
        }

        await connection.query(`
            DELETE FROM rentals WHERE id = $1;
        `, [id]);
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.listen(4000, ()=> console.log('Listening on Port 4000'));