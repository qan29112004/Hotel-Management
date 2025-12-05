export interface Payment{
    uuid:string,
    amount:number,
    status?:string,
    transactionId?:string,
    method?:string,
    currency?:number,
    selected?:boolean,
    priceVnd?:number
}