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
                WHERE games.name LIKE $1;
            `, [`%${myQuery}%`]);
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
                SELECT * FROM customers WHERE cpf LIKE $1;
            `, [`${cpf}%`]);
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
    let game = '';
    let customer = '';

    if(req.query.gameId){
        game = `WHERE "gameId" = ${req.query.gameId}`;
    } else if (req.query.customerId){
        customer = `WHERE "customerId" = ${req.query.customerId}`;
    }

    try {
        const allRentals = await connection.query({
            text: `
                SELECT rentals.*, 
                    customers.name AS customerName,
                    games.name AS "gameName",
                    games."categoryId", categories.name AS "categoryName"

                FROM rentals
                    JOIN customers ON rentals."customerId" = customers.id
                    JOIN games ON rentals."gameId" = games.id
                    JOIN categories ON games."categoryId" = categories.id
                ${game}
                ${customer}
            ;`,
            rowMode: 'array'
        });
        res.send(allRentals.rows.map(row =>{
            const [
                id, customerId, gameId, rentDate, daysRented, returnDate, originalPrice, 
                delayFee, customerName, gameName, categoryId, categoryName
            ] = row;

            const initialDate = rentDate.toISOString().split("T")[0];
            let returned = null;
            if(returnDate !== null){
                returned = returnDate.toISOString().split("T")[0];
            }

            return {
                id, customerId, gameId, rentDate: initialDate, daysRented, 
                returnDate: returned, originalPrice, delayFee,
                customer: { 
                    id: customerId, name: customerName
                },
                game: {
                    id: gameId, name: gameName, 
                    categoryId: categoryId, categoryName: categoryName
                }
            }
        }));
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post("/rentals", async (req, res) => {
    const {customerId, gameId, daysRented} = req.body;

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
            WHERE "gameId"=$1 AND "returnDate" IS NULL;
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
        `, [customerId, gameId, dayjs().format("YYYY-MM-DD"), daysRented, price]);

        console.log(dayjs().format("YYYY-MM-DD"))
        res.sendStatus(201);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.post("/rentals/:id/return", async (req, res) => {
    const {id} = req.params;
    let fee = 0;
    try {
        const existentRent = await connection.query(`
            SELECT * FROM rentals WHERE id = $1;
        `, [id]);
        if(existentRent.rows.length === 0){
            res.sendStatus(404);
        } else if(existentRent.rows[0].returnDate !== null){
            res.sendStatus(400);
        }
        const existentGame = await connection.query(`
            SELECT * FROM games WHERE id = $1;
        `, [existentRent.rows[0].gameId]);

        const dateOfRent = parseInt(existentRent.rows[0].rentDate.toISOString().split("T")[0].split("-")[2]);
        const numberOfDaysRented = existentRent.rows[0].daysRented;
        const actualDay = parseInt(dayjs().format("DD"));
        const priceAday = existentGame.rows[0].pricePerDay;

        if((dateOfRent + numberOfDaysRented) < actualDay){
            fee = (dateOfRent + numberOfDaysRented - actualDay) * priceAday;
        };


        await connection.query(`
            UPDATE rentals SET "returnDate" = $1, "delayFee" = $2
            WHERE id = $3;
        `, [dayjs().format("YYYY-MM-DD"), fee, id]);

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
        } else if (existentRentals.rows[0].returnDate !== null){
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