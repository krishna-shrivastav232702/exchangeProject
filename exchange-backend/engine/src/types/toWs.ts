
export type TickerUpdateMessage = {
    stream:string,

}

export type DepthUpdateMessage = {
    
}

export type TradeAddedMessage = {
    
}

export type WsMessage = TickerUpdateMessage | DepthUpdateMessage | TradeAddedMessage;