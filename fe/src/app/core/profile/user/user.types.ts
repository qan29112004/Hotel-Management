export interface User {
    username: string;
    email: string;

    avatar?: string;
    status?: string;
    role?: number;
    isStaff?: boolean;
    isSuperuser?: boolean;
    id: number;
    fullname?: string;
    fullName?: string;
    phone?: string;
    gender?: string;
    address?: string;
    birth_day?: string;
    last_login?: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    isFisrtLogin?:boolean
}

export interface Status {
    id: number;
    name: string;
    class: string;
    is_list: boolean;
}

export interface Role {
    id: number;
    name: string;
    class: string;
    is_list: boolean;
}
