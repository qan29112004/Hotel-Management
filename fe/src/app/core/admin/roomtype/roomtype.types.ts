export interface RoomType {
    uuid: string;
    name: string;
    description: string;
    hotelId: string;
    images?: string[];
    size:string;
    thumbnail?: string;
    maxOccupancy: number;
    basePrice: number;
    amenities?: string[];
    createdAt?: string;
    updatedAt?: string;
    selected?: boolean;
    createdBy?: {
        username: string;
    };
    updatedBy?: {
        username: string;
    };
}