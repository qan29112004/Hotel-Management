export interface Offer{
    uuid:string,
    title?:string,
    description?:string,
    code?:string,
    discountPercentage?:number,
    startDate?:string,
    endDate?:string,
    minPrice?:number,
    isActive?:boolean,
    amountDays?:number
    images?:string,
    hotel?:any,
    selected?:boolean
    createdAt?:string
}