import { Router } from "express";

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  res.json([{
    firstPrice: "100.00",
    high: "120.00",
    lastPrice: "115.00",
    low: "95.00",
    priceChange: "15.00",
    priceChangePercent: "15.00",
    quoteVolume: "500000.00",
    symbol: "TATA_INR",
    trades: "15000",
    volume: "4300.00"
  }]);
});
