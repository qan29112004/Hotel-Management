export interface Rating{
    uuid:string,
    selected?:boolean,
    review:string,
    rating:number,
    hotel:any,
    booking:any,
    subject:string,
    isActive:boolean,
    roomtype:any[],
    createdAt?: string;
    updatedAt?: string;
    createdBy?: {
        username: string;
    };
    updatedBy?: {
        username: string;
    };
}