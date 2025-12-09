export interface Refund {
    uuid: string;
    payment: string; // ID
    booking_room: string | null; // ID
    amount: number;
    status: 'Pending' | 'Completed' | 'Fail';
    processed_at: string;
    created_at: string;
    updated_at: string;
    transaction_id?: string;
    method?: string;
    booking_uuid?: string;
    selected?:boolean
}
