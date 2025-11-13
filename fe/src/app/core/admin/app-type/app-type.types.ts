export interface AppType
{
    id: number;
    logo: string;
    title: string;
    appType: number;
    secretKey: string;
    url: string;
    isLocked: boolean;
    createdBy: {
        id: number;
        username: string;
        avatar: string;
    };
    updatedBy: {
        id: number;
        username: string;
        avatar: string;
    };
    created_at: string;
    updated_at: string;
    status?: number;
    industry?: number;
    describe?: string;
}

export interface Status {
    id: number;
    name: string;
    class: string;
    is_list: boolean;
}

export interface Industry {
    id: number;
    name: string;
    class: string;
}