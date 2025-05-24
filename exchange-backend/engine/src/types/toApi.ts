import { Order } from "../trade/Orderbook"

export type MessageToApi = {
    type: "DEPTH",
    payload: {
        bids: [string, string][], //array of tuple , each tuple -> two strings ( price , quantity)
        asks: [string, string][],
    }
} | {
    type:"ORDER_PLACED",
    payload:{
        orderId: string,
        executedQty: number,
        fills:{
            price:string,
            qty:number,
            tradeId: number
        }[]
    }
} | {
    type:"ORDER_CANCELLED",
    payload:{
        orderId:string,
        executedQty: number,
        remainingQty: number
    }
} | {
    type:"OPEN_ORDERS",
    payload:Order[]
}