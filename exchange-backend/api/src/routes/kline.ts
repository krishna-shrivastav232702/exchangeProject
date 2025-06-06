import { Client } from "pg";
import dotenv from "dotenv"
import { Request,Response, Router } from "express";

dotenv.config();


const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'exchange',
    password: process.env.DATABASE_PASSWORD,
    port: 5432
})

pgClient.connect();

export const klineRouter = Router();

klineRouter.get("/", async (req:Request, res:Response) => {
    const { symbol, interval, startTime, endTime } = req.query;
    
    let query;
    switch (interval) {
        case '1m':
            query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
            break;
        case '1h':
            query = `SELECT * FROM klines_1h WHERE bucket >= $1 AND bucket <= $2`;
            break;
        case '1w':
            query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
            break;
        default:
            res.status(400).send('Invalid Interval');
            return;
    }

    try {
        //@ts-ignore
        const result = await pgClient.query(query, [new Date(startTime * 1000 as string), new Date(endTime * 1000 as string)]);
        console.log("result",result);
        res.json(result.rows.map(x => ({
            close: x.close,
            end: x.bucket,
            high: x.high,
            low: x.low,
            open: x.open,
            quoteVolume: x.quoteVolume,
            start: x.start,
            trades: x.trades,
            volume: x.volume,
        })))
        return;
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
        return;
    }
})