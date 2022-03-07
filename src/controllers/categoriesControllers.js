import connection from "../database/index.js";

export async function getCategories (req, res) {
    try {
        const allCategories = await connection.query(`
        SELECT * FROM categories;
        `)
        res.send(allCategories.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};

export async function postCategory (req, res) {
    const {name} = req.body;
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
};

export default {
    getCategories,
    postCategory
};