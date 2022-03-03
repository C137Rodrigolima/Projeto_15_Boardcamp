import dotenv from "dotenv";
dotenv.config();
import pg from 'pg';

const { Pool } = pg;

const user = process.env.DBUSER;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const port = process.env.PORT;
const database = process.env.DATABASE;

const connection = new Pool({
    user,
    password,
    host,
    port,
    database
});

export default connection;