import { BASE_CURRENCY } from "./Engine";

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
}

export class Orderbook {
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
        this.bids = bids;
        this.baseAsset = baseAsset;
        this.asks = asks;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }
    
    getSnapshot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }
    
    addOrder(order: Order): {
        executedQty: number,
        fills: Fill[]
    } {
        if (order.side === "buy") {
            const { executedQty, fills } = this.matchBid(order);
            order.filled = executedQty;
            if (executedQty < order.quantity) {
                // Add remaining quantity to order book
                const remainingOrder = {
                    ...order,
                    quantity: order.quantity - executedQty,
                    filled: 0
                };
                this.bids.push(remainingOrder);
                this.bids.sort((a, b) => b.price - a.price); // Sort highest price first
            }
            return {
                executedQty,
                fills
            }
        } else {
            const { executedQty, fills } = this.matchAsk(order);
            order.filled = executedQty;
            if (executedQty < order.quantity) {
                // Add remaining quantity to order book
                const remainingOrder = {
                    ...order,
                    quantity: order.quantity - executedQty,
                    filled: 0
                };
                this.asks.push(remainingOrder);
                this.asks.sort((a, b) => a.price - b.price); // Sort lowest price first
            }
            return {
                executedQty,
                fills
            }
        }
    }
    
    matchBid(order: Order): { fills: Fill[], executedQty: number } {
        const fills: Fill[] = [];
        let executedQty = 0;
        
        // Sort asks by price (lowest first)
        this.asks.sort((a, b) => a.price - b.price);
        
        // Use a while loop to handle array modifications safely
        let i = 0;
        while (i < this.asks.length && executedQty < order.quantity) {
            const ask = this.asks[i];
            
            // Buy order can match with ask if ask price <= buy price
            if (ask.price <= order.price) {
                const remainingOrderQty = order.quantity - executedQty;
                const availableAskQty = ask.quantity - ask.filled;
                const filledQty = Math.min(remainingOrderQty, availableAskQty);
                
                executedQty += filledQty;
                ask.filled += filledQty;
                
                fills.push({
                    price: ask.price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: ask.userId,
                    markerOrderId: ask.orderId
                });
                
                // Update current price to the last traded price
                this.currentPrice = ask.price;
                
                // If ask is fully filled, remove it immediately
                if (ask.filled >= ask.quantity) {
                    this.asks.splice(i, 1);
                    // Don't increment i since we removed an element
                } else {
                    i++; // Only increment if we didn't remove an element
                }
            } else {
                i++; // Move to next ask if no match
            }
        }
        
        return {
            executedQty,
            fills
        }
    }
    
    matchAsk(order: Order): { fills: Fill[], executedQty: number } {
        const fills: Fill[] = [];
        let executedQty = 0;
        
        // Sort bids by price (highest first)
        this.bids.sort((a, b) => b.price - a.price);
        
        // Use a while loop to handle array modifications safely
        let i = 0;
        while (i < this.bids.length && executedQty < order.quantity) {
            const bid = this.bids[i];
            
            // Sell order can match with bid if bid price >= sell price
            if (bid.price >= order.price) {
                const remainingOrderQty = order.quantity - executedQty;
                const availableBidQty = bid.quantity - bid.filled;
                const filledQty = Math.min(remainingOrderQty, availableBidQty);
                
                executedQty += filledQty;
                bid.filled += filledQty;
                
                fills.push({
                    price: bid.price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: bid.userId,
                    markerOrderId: bid.orderId
                });
                
                // Update current price to the last traded price
                this.currentPrice = bid.price;
                
                // If bid is fully filled, remove it immediately
                if (bid.filled >= bid.quantity) {
                    this.bids.splice(i, 1);
                    // Don't increment i since we removed an element
                } else {
                    i++; // Only increment if we didn't remove an element
                }
            } else {
                i++; // Move to next bid if no match
            }
        }
        
        return {
            fills,
            executedQty
        }
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index, 1);
            return price;
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            return price;
        }
    }

    getDepth() {
        const bids: [string, string][] = [];
        const asks: [string, string][] = [];

        const bidsObj: { [key: string]: number } = {};
        const asksObj: { [key: string]: number } = {};

        // Aggregate bids by price
        for (let i = 0; i < this.bids.length; i++) {
            const order = this.bids[i];
            const remainingQty = order.quantity - order.filled;
            if (remainingQty > 0) {
                if (!bidsObj[order.price]) {
                    bidsObj[order.price] = 0;
                }
                bidsObj[order.price] += remainingQty;
            }
        }

        // Aggregate asks by price
        for (let i = 0; i < this.asks.length; i++) {
            const order = this.asks[i];
            const remainingQty = order.quantity - order.filled;
            if (remainingQty > 0) {
                if (!asksObj[order.price]) {
                    asksObj[order.price] = 0;
                }
                asksObj[order.price] += remainingQty;
            }
        }

        // Convert to array format and sort
        for (const price in bidsObj) {
            bids.push([price, bidsObj[price].toString()]);
        }

        for (const price in asksObj) {
            asks.push([price, asksObj[price].toString()]);
        }

        // Sort bids by price (highest first)
        bids.sort((a, b) => Number(b[0]) - Number(a[0]));
        
        // Sort asks by price (lowest first)
        asks.sort((a, b) => Number(a[0]) - Number(b[0]));

        return {
            bids,
            asks
        }
    }
}