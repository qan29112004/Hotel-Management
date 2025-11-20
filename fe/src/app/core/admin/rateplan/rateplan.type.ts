export interface RatePlan{
    uuid:string,
    name:string,
    description:string,
    priceModifier:number,
    selected?:boolean,
    isActive:boolean,
    needLogin:boolean,
    refundable:boolean,
    isBreakfast:boolean,
    guaranteePolicy:string,
    cancellationPolicy:string,
    hotel:any,
    services:any[]
}