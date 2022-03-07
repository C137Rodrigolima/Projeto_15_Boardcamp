import connection from "../database/index.js";

export async function getCustomers(req, res) {
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

        customersList.rows.map(row => {
            return row.birthday = row.birthday.toISOString().split("T")[0];
        })

        res.send(customersList.rows);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};

export async function getCustomersbyId(req, res) {
    const {id} = req.params;
    try {
        const customer = await connection.query(`
            SELECT * FROM customers
            WHERE id=$1;
        `, [id]);
        if(customer.rows.length === 0){
            return res.sendStatus(404);
        }

        customer.rows[0].birthday = customer.rows[0].birthday.toISOString().split("T")[0];

        res.send(customer.rows[0]);
    } catch (error) {
        res.sendStatus(error);
    }
};

export async function postCustomers(req, res) {
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
};

export async function putCustomers(req, res) {
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
};

export default {
    getCustomers,
    getCustomersbyId,
    postCustomers
};