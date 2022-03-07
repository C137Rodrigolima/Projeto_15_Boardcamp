import connection from "../database/index.js";

export async function getGames(req, res) {
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
};

export async function postGames(req,res) {
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;

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
};

export default getGames;