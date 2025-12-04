export interface PriceRule{
    uuid: string;
    ruleType: string;
    multiplier: number;
    createdAt?: string;
    updatedAt?: string;
    selected?:boolean;
    createdBy?: {
        username: string;
    };
    updatedBy?: {
        username: string;
    };
}