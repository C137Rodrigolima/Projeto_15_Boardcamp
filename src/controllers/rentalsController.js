import connection from "../database/index.js";
import dayjs from "dayjs";

export async function getRentals(req, res) {
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
};

export async function postRentals(req, res) {
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
};

export async function finalizeRent(req, res) {
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
};

export async function deleteRent(req, res) {
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
};

export default {
    getRentals,
    postRentals,
    finalizeRent,
    deleteRent
};
