export interface User {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phone?: string;
    avatar?: string;
    description?: string;
    gender?: string;
    isStaff?: boolean;
    isSuperuser?: boolean;
    birthday?: string;
    status?: number;
    role?: number;
    lastLogin?: string;
    selected?: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: number;
    updatedAt: number;
}

export interface UserResponse {
    type: string;
    code: number;
    message: string;
    data: {
        users: User[];
        totalUser: number;
        statusSummary: {
            active: number;
            waiting: number;
            inactive: number;
        };
    };
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
