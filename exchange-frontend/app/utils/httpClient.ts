import axios from "axios"
import { Ticker } from "./types";


const BASE_URL = "http://localhost:3005/api/v1";

export async function getTicker(market:string):Promise<Ticker>{
    const tickers = await getTickers();
    const ticker = tickers.find(t => t.symbol === market);
    if(!ticker){
        throw new Error(`No ticker found for ${market}`);
    }
    return ticker;
}


export async function getTickers():Promise<Ticker[]>{
    const response = await axios.get(`${BASE_URL}/tickers`);
    return response.data;
}


