export interface Voucher {
  uuid: string;
  name: string;
  code: string;
  description?: string | null;

  discountType: string;
  discountValue: number;
  discountPercent?: number | null;
  maxDiscountAmount?: number | null;
  minOrderValue: number;

  startAt: string;        // ISO datetime
  expireAt: string;       // ISO datetime
  relativeExpiryHours?: number | null;

  maxUsageGlobal?: number | null;
  maxUsagePerUser: number;

  status: string;

  requiresClaim: boolean;
  stackable: boolean;

  totalClaimed: number;
  totalUsed: number;

  conditions?: Record<string, any>;

  hotels: string[];       // list of hotel UUIDs
  selected?:boolean
}

export interface PreviewVoucher{
    code:string,
    order_total:number,
    hotel_id:string
}

export interface ApplyVoucher{
    code:string,
    booking_uuid:string,
    order_total:number
}

export interface RedeemVoucher{
    code:string,
    order_total:number,
    booking_uuid:string
}
export interface RevertVoucher{
    booking_uuid:string
}