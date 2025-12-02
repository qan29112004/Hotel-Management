export interface Facilities{
    uuid: string;
    name: string;
    icon: string;
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