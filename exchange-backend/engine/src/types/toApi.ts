export type MessageToApi = {
    type:"DEPTH",
    payload:{
        bids:[string,string][], //array of tuple , each tuple -> two strings ( price , quantity)
        asks:[string,string][],
    }
} | {

}