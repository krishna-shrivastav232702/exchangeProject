import { createClient, RedisClientType } from "redis";
import { MessageFromOrderbook } from "./types";
import { MessageToEngine } from "./types/toEngine";



//using single ton pattern so that there is only one instance throughout the application
// the Singleton Pattern typically uses:

// A private static member to hold the single instance.
// A private constructor to prevent external instantiation.
// A public static method (like getInstance) to access the instance.

export class RedisManager{
    private client: RedisClientType;
    private publisher: RedisClientType;
    private static instance: RedisManager;

    private constructor(){
        this.client = createClient();
        this.client.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static getInstance(){
        if(!this.instance){
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    //redis-queue -> working 
    // client->subscribes to redis channel or queue named after unique id to recieve response
    // func->pushes message to messages
    // listens for response on the subscribed channel -> resolves the promise and unsubscribe from the channel once message recieved

    public sendAndAwait(message:MessageToEngine){
        return new Promise<MessageFromOrderbook>((resolve)=>{
            const id = this.getRandomClientId();
            this.client.subscribe(id,(message)=>{
                this.client.unsubscribe(id);
                resolve(JSON.parse(message));
            });
            this.publisher.lPush("messages",JSON.stringify({clientId:id,message}));
        });
    }

    public getRandomClientId(){
        return Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15);
    }
    
}