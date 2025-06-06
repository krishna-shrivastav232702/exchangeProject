import express from "express";
import cors from "cors";
import { orderRouter } from "./routes/order";
import { depthRouter } from "./routes/depth";
import { klineRouter } from "./routes/kline";
import { tickersRouter } from "./routes/tickers";
import { tradesRouter } from "./routes/trades";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/order",orderRouter);
app.use("/api/v1/depth",depthRouter);
app.use("/api/v1/klines",klineRouter);
app.use("/api/v1/tickers", tickersRouter);
app.use("/api/v1/trades", tradesRouter);

app.listen(3005,()=>{
    console.log("Server is running on port 3005");
});