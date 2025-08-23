"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:3005/api/v1";

export function SwapUI({ market }: { market: string }) {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [activeTab, setActiveTab] = useState('buy');
    const [type, setType] = useState('limit');
    const [balance, setBalance] = useState({ base: 0, quote: 0 });
    const [loading, setLoading] = useState(false);

    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    // Mock user ID - in a real app, this would come from authentication
    const userId = "1";

    useEffect(() => {
        // Mock balance fetch - replace with actual API call
        setBalance({
            base: 1000, // TATA balance
            quote: 50000 // INR balance
        });
    }, []);

    const handleSubmit = async () => {
        if (!price || !quantity) {
            alert("Please enter both price and quantity");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${BASE_URL}/order`, {
                market,
                price: price.toString(),
                quantity: quantity.toString(),
                side: activeTab,
                userId
            });

            console.log("Order response:", response.data);
            alert(`${activeTab.toUpperCase()} order placed successfully!`);

            // Reset form
            setPrice('');
            setQuantity('');

        } catch (error: any) {
            console.error("Order error:", error);
            alert(`Error placing order: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        const p = parseFloat(price) || 0;
        const q = parseFloat(quantity) || 0;
        return (p * q).toFixed(2);
    };

    const setPercentage = (percentage: number) => {
        if (activeTab === 'buy') {
            // For buy orders, calculate quantity based on available quote balance
            const availableQuote = balance.quote;
            const p = parseFloat(price) || 0;
            if (p > 0) {
                const maxQuantity = availableQuote / p;
                const targetQuantity = (maxQuantity * percentage / 100).toFixed(6);
                setQuantity(targetQuantity);
            }
        } else {
            // For sell orders, calculate quantity based on available base balance
            const availableBase = balance.base;
            const targetQuantity = (availableBase * percentage / 100).toFixed(6);
            setQuantity(targetQuantity);
        }
    };

    return (
        <div>
            <div className="flex flex-col">
                <div className="flex flex-row h-[60px]">
                    <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
                    <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="px-3">
                        <div className="flex flex-row flex-0 gap-5 undefined">
                            <LimitButton type={type} setType={setType} />
                            <MarketButton type={type} setType={setType} />
                        </div>
                    </div>
                    <div className="flex flex-col px-3">
                        <div className="flex flex-col flex-1 gap-3 text-baseTextHighEmphasis">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between flex-row">
                                    <p className="text-xs font-normal text-baseTextMedEmphasis">Available Balance</p>
                                    <p className="font-medium text-xs text-baseTextHighEmphasis">
                                        {activeTab === 'buy'
                                            ? `${balance.quote.toFixed(2)} ${quoteAsset}`
                                            : `${balance.base.toFixed(2)} ${baseAsset}`
                                        }
                                    </p>
                                </div>
                            </div>

                            {type === 'limit' && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs font-normal text-baseTextMedEmphasis">
                                        Price
                                    </p>
                                    <div className="flex flex-col relative">
                                        <input
                                            step="0.01"
                                            placeholder="0"
                                            className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-white placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0"
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                        <div className="flex flex-row absolute right-1 top-1 p-2">
                                            <div className="relative text-xs text-slate-400">
                                                {quoteAsset}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-normal text-baseTextMedEmphasis">
                                Quantity
                            </p>
                            <div className="flex flex-col relative">
                                <input
                                    step="0.01"
                                    placeholder="0"
                                    className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-white placeholder-baseTextMedEmphasis ring-0 transition focus:border-accentBlue focus:ring-0"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                                <div className="flex flex-row absolute right-1 top-1 p-2">
                                    <div className="relative text-xs text-slate-400">
                                        {baseAsset}
                                    </div>
                                </div>
                            </div>

                            {type === 'limit' && (
                                <div className="flex justify-end flex-row">
                                    <p className="font-medium pr-2 text-xs text-baseTextMedEmphasis">
                                        ≈ {calculateTotal()} {quoteAsset}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center flex-row mt-2 gap-3">
                                <div
                                    className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3"
                                    onClick={() => setPercentage(25)}
                                >
                                    25%
                                </div>
                                <div
                                    className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3"
                                    onClick={() => setPercentage(50)}
                                >
                                    50%
                                </div>
                                <div
                                    className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3"
                                    onClick={() => setPercentage(75)}
                                >
                                    75%
                                </div>
                                <div
                                    className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3"
                                    onClick={() => setPercentage(100)}
                                >
                                    Max
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={`font-semibold focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 ${activeTab === 'buy'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleSubmit}
                            disabled={loading || !price || !quantity}
                        >
                            {loading ? 'Placing...' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ${baseAsset}`}
                        </button>

                        <div className="flex justify-between flex-row mt-1">
                            <div className="flex flex-row gap-2">
                                <div className="flex items-center">
                                    <input className="form-checkbox rounded border border-solid border-baseBorderMed bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-baseBorderMed checked:bg-base-900 checked:hover:border-baseBorderMed focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-baseBorderMed cursor-pointer h-5 w-5" id="postOnly" type="checkbox" />
                                    <label className="ml-2 text-xs">Post Only</label>
                                </div>
                                <div className="flex items-center">
                                    <input className="form-checkbox rounded border border-solid border-baseBorderMed bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-baseBorderMed checked:bg-base-900 checked:hover:border-baseBorderMed focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-baseBorderMed cursor-pointer h-5 w-5" id="ioc" type="checkbox" />
                                    <label className="ml-2 text-xs">IOC</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LimitButton({ type, setType }: { type: string, setType: any }) {
    return <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('limit')}>
        <div className={`text-sm font-medium py-1 border-b-2 ${type === 'limit' ? "border-accentBlue text-baseTextHighEmphasis" : "border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"}`}>
            Limit
        </div>
    </div>
}

function MarketButton({ type, setType }: { type: string, setType: any }) {
    return <div className="flex flex-col cursor-pointer justify-center py-2" onClick={() => setType('market')}>
        <div className={`text-sm font-medium py-1 border-b-2 ${type === 'market' ? "border-accentBlue text-baseTextHighEmphasis" : "border-b-2 border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"} `}>
            Market
        </div>
    </div>
}

function BuyButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'buy' ? 'border-b-green-500 bg-green-900 bg-opacity-20' : 'border-b-gray-600 hover:border-b-gray-400'}`} onClick={() => setActiveTab('buy')}>
        <p className="text-center text-sm font-semibold text-green-400">
            Buy
        </p>
    </div>
}

function SellButton({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: any }) {
    return <div className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${activeTab === 'sell' ? 'border-b-red-500 bg-red-900 bg-opacity-20' : 'border-b-gray-600 hover:border-b-gray-400'}`} onClick={() => setActiveTab('sell')}>
        <p className="text-center text-sm font-semibold text-red-400">
            Sell
        </p>
    </div>
}