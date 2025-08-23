import { Ticker } from "./types";

export const BASE_URL = "ws://localhost:3001"

export class SignalingManager {
    private ws: WebSocket | null = null;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: any = {};
    private id: number;
    private initialized: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000; // Start with 1 second
    private reconnectTimer: NodeJS.Timeout | null = null;
    private subscriptions: Set<string> = new Set(); // Track active subscriptions

    private constructor(){
        this.id = 1;
        this.connect();
    }

    private connect() {
        try {
            this.ws = new WebSocket(BASE_URL);
            this.init();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }

    private init(){
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.initialized = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            
            // Resubscribe to all previous subscriptions
            this.subscriptions.forEach(subscription => {
                this.ws?.send(JSON.stringify({
                    method: "SUBSCRIBE",
                    params: [subscription]
                }));
            });
            
            // Send buffered messages
            this.bufferedMessages.forEach(message => {
                this.ws?.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        }

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const type = message.data.e;
                if(this.callbacks[type]){
                    this.callbacks[type].forEach(({ callback }: { callback: (data: any) => void }) => {
                        if(type === "ticker"){
                            const newTicker:Partial<Ticker> = {
                                lastPrice: message.data.c,
                                high:message.data.h,
                                low:message.data.l,
                                volume:message.data.v,
                                quoteVolume:message.data.V,
                                symbol:message.data.s,
                            }
                            console.log(newTicker);
                            callback(newTicker);
                        }
                        if(type === "depth"){
                            const updatedBids = message.data.b;
                            const updatedAsks = message.data.a;
                            callback({bids:updatedBids,asks:updatedAsks});
                        }
                    })
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        }

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.initialized = false;
            this.scheduleReconnect();
        }

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.initialized = false;
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.reconnectAttempts++;
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff, max 30 seconds
            this.connect();
        }, this.reconnectDelay);
    }

    public static getInstance(){
        if(!this.instance){
            this.instance = new SignalingManager();
        }
        return this.instance;
    }
    
    sendMessage(message: any){
        const messageToSend = {
            ...message,
            id: this.id++
        }
        
        // Track subscriptions for reconnection
        if (message.method === "SUBSCRIBE" && message.params) {
            message.params.forEach((param: string) => {
                this.subscriptions.add(param);
            });
        } else if (message.method === "UNSUBSCRIBE" && message.params) {
            message.params.forEach((param: string) => {
                this.subscriptions.delete(param);
            });
        }
        
        if(!this.initialized || !this.ws){
            this.bufferedMessages.push(messageToSend);
            return;
        }
        
        try {
            this.ws.send(JSON.stringify(messageToSend));
        } catch (error) {
            console.error('Failed to send message:', error);
            this.bufferedMessages.push(messageToSend);
        }
    }

    async registerCallback(type:string,callback:any, id:string){
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({callback,id});
    }

    async deregistercallback(type:string,id:string){
        if(this.callbacks[type]){
            const index = this.callbacks[type].findIndex((callback: { callback: (data: any) => void; id: string }) => callback.id === id);
            if(index !== -1){
                this.callbacks[type].splice(index,1);
            }
        }
    }

    public isConnected(): boolean {
        return this.initialized && this.ws?.readyState === WebSocket.OPEN;
    }

    public getConnectionStatus(): string {
        if (!this.ws) return 'disconnected';
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    public forceReconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connect();
    }

    public resubscribeAll() {
        if (this.initialized && this.ws) {
            this.subscriptions.forEach(subscription => {
                this.ws?.send(JSON.stringify({
                    method: "SUBSCRIBE",
                    params: [subscription]
                }));
            });
        }
    }

}

