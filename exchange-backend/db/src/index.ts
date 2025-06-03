import { Client } from "pg";
import dotenv from "dotenv"
import { createClient } from "redis";
import { DbMessage } from "./types";

dotenv.config();


const pgClient = new Client({
    user:'postgres',
    host:'localhost',
    database:'exchange',
    password:process.env.DATABASE_PASSWORD,
    port:5432
});
pgClient.connect();

async function main() {
    const redisClient = createClient();
    await redisClient.connect();

    console.log('connected to redis');

    while(true){
        const response = await redisClient.rPop("db_processor" as string)
        if(!response){

        }else{
            const data: DbMessage = JSON.parse(response);
            if(data.type === "TRADE_ADDED"){
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const query = 'INSERT INTO tata_prices (time,price) VALUES ($1,$2)';
                const values = [timestamp,price];
                await pgClient.query(query,values);
            }

        }
    }
}

main();