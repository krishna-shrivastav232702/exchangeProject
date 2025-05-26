import { Client } from "pg";
import dotenv from "dotenv"

dotenv.config();

const client = new Client({
    user: 'postgres',
    host:'localhost',
    database:'exchange',
    password:process.env.DATABASE_PASSWORD,
    port:5432
});

client.connect();

async function refreshViews(){
    await client.query('REFRESH MATERIALIZED VIEW klines_1m');
    await client.query('REFRESH MATERIALIZED VIEW klines_1h');
    await client.query('REFRESH MATERIALIZED VIEW klines_1w');

    console.log("Materialized views refreshed successfully ");
}

refreshViews().catch(console.error);

setInterval(()=>{
    refreshViews()
},1000*10);