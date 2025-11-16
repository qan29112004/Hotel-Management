export interface Booking{
    uuid:string,
    userEmail:string,
    userFullname:string,
    userPhone:string,
    hotelId:any,
    checkIn:string,
    checkOut:string,
    numGuest:number,
    totalPrice:number,
    status:string,
    totalRooms:number,
    selected:boolean
}