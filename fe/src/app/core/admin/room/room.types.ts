export interface Room {
    uuid: string;
    roomTypeId: string;
    images?: string[];
    roomNumber?:string;
    createdAt?: string;
    updatedAt?: string;
    selected?: boolean;
    status?:string;
    floor?:number;
    housekeeping_status?:string
    createdBy?: {
        username: string;
    };
    updatedBy?: {
        username: string;
    };
}