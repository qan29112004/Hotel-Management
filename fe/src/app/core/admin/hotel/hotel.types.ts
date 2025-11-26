export interface Hotel {
    uuid: string;
    name: string;
    address: string;
    slug: string;
    phone: string;
    status: 'Live' | 'Draft' | 'Rejecte' | 'Disabled'| 'In Preview';
    views: number;
    thumbnail?: string;
    destination:string;
    check_in_time: string;
    check_out_time: string;
    latitude?: number;
    longitude?: number;
    description: string;
    created_at?: string;
    updated_at?: string;
    selected?: boolean;
    created_by?: {
        username: string;
    };
    updated_by?: {
        username: string;
    };
    images?: string[];
}

export interface CalendarPrice {
    date:string,
    price:string,
    isAvailableRoom?:boolean
}