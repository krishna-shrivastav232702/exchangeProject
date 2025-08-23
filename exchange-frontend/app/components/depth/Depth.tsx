"use client";

import { SignalingManager } from "@/app/utils/SignalingManager";
import { useEffect, useState } from "react";
import { getDepth, getTicker, getTrades } from "@/app/utils/httpClient";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";

export function Depth({ market }: { market: string }) {
    const [bids, setBids] = useState<[string, string][]>([]);
    const [asks, setAsks] = useState<[string, string][]>([]);
    const [price, setPrice] = useState<string>();
    const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
    
    useEffect(() => {
        // Check connection status periodically
        const connectionCheckInterval = setInterval(() => {
            const status = SignalingManager.getInstance().getConnectionStatus();
            setConnectionStatus(status);
            
            // If disconnected, try to reconnect
            if (status === 'disconnected') {
                SignalingManager.getInstance().forceReconnect();
            }
        }, 2000);

        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            console.log("Depth has been updated");
            console.log(data);
            
            if (data.bids && data.bids.length > 0) {
                setBids((originalBids) => {
                    const bidsAfterUpdate = [...(originalBids || [])];
                    
                    // Update existing bids or remove if quantity is 0
                    for (let i = 0; i < bidsAfterUpdate.length; i++) {
                        for (let j = 0; j < data.bids.length; j++) {
                            if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                                if (Number(data.bids[j][1]) === 0) {
                                    bidsAfterUpdate.splice(i, 1);
                                    i--; // Adjust index after removal
                                } else {
                                    bidsAfterUpdate[i][1] = data.bids[j][1];
                                }
                                break;
                            }
                        }
                    }

                    // Add new bids
                    for (let j = 0; j < data.bids.length; j++) {
                        if (Number(data.bids[j][1]) !== 0 && !bidsAfterUpdate.some(bid => bid[0] === data.bids[j][0])) {
                            bidsAfterUpdate.push(data.bids[j]);
                        }
                    }
                    
                    // Sort bids by price (highest first)
                    bidsAfterUpdate.sort((x, y) => Number(y[0]) - Number(x[0]));
                    return bidsAfterUpdate;
                });
            }

            if (data.asks && data.asks.length > 0) {
                setAsks((originalAsks) => {
                    const asksAfterUpdate = [...(originalAsks || [])];

                    // Update existing asks or remove if quantity is 0
                    for (let i = 0; i < asksAfterUpdate.length; i++) {
                        for (let j = 0; j < data.asks.length; j++) {
                            if (asksAfterUpdate[i][0] === data.asks[j][0]) {
                                if (Number(data.asks[j][1]) === 0) {
                                    asksAfterUpdate.splice(i, 1);
                                    i--; // Adjust index after removal
                                } else {
                                    asksAfterUpdate[i][1] = data.asks[j][1];
                                }
                                break;
                            }
                        }
                    }

                    // Add new asks
                    for (let j = 0; j < data.asks.length; j++) {
                        if (Number(data.asks[j][1]) !== 0 && !asksAfterUpdate.some(ask => ask[0] === data.asks[j][0])) {
                            asksAfterUpdate.push(data.asks[j]);
                        }
                    }
                    
                    // Sort asks by price (lowest first)
                    asksAfterUpdate.sort((x, y) => Number(x[0]) - Number(y[0]));
                    return asksAfterUpdate;
                });
            }
        }, `DEPTH-${market}`);

        SignalingManager.getInstance().sendMessage({ 
            "method": "SUBSCRIBE", 
            "params": [`depth@${market}`] 
        });

        // Initialize depth data
        getDepth(market).then(d => {
            if (d.bids && d.asks) {
                setBids(d.bids.sort((x, y) => Number(y[0]) - Number(x[0])));
                setAsks(d.asks.sort((x, y) => Number(x[0]) - Number(y[0])));
            }
        }).catch(console.error);

        // Get initial price
        getTicker(market).then(t => {
            if (t.lastPrice) {
                setPrice(t.lastPrice);
            }
        }).catch(() => {
            // If ticker fails, try trades
            getTrades(market).then(t => {
                if (t && t.length > 0) {
                    setPrice(t[0]?.price);
                }
            }).catch(console.error);
        });

        return () => {
            clearInterval(connectionCheckInterval);
            SignalingManager.getInstance().sendMessage({ 
                "method": "UNSUBSCRIBE", 
                "params": [`depth@${market}`] 
            });
            SignalingManager.getInstance().deregistercallback("depth", `DEPTH-${market}`);
        }
    }, [market]);

    return <div className="flex flex-col h-full">
        {/* Connection Status Indicator */}
        <div className={`text-xs p-1 text-center ${
            connectionStatus === 'connected' ? 'bg-green-800 text-green-200' : 
            connectionStatus === 'connecting' ? 'bg-yellow-800 text-yellow-200' : 
            'bg-red-800 text-red-200'
        }`}>
            {connectionStatus === 'connected' ? '🟢 Live' : 
             connectionStatus === 'connecting' ? '🟡 Connecting...' : 
             '🔴 Disconnected'}
            {connectionStatus !== 'connected' && (
                <button 
                    onClick={() => SignalingManager.getInstance().forceReconnect()}
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                >
                    Reconnect
                </button>
            )}
        </div>
        
        <TableHeader />
        {asks && asks.length > 0 && <AskTable asks={asks} />}
        {price && (
            <div className="flex justify-center py-2 border-y border-slate-700">
                <span className="text-lg font-bold text-white">
                    ${Number(price).toFixed(2)}
                </span>
            </div>
        )}
        {bids && bids.length > 0 && <BidTable bids={bids} />}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs p-2 bg-slate-800 border-b border-slate-700">
        <div className="text-white font-semibold">Price</div>
        <div className="text-slate-400">Size</div>
        <div className="text-slate-400">Total</div>
    </div>
}