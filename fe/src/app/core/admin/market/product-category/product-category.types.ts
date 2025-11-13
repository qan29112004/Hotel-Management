export interface ProductCategory
{
    id: number;
    name: string;
    slug: string;
    categoryParent: number;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    highlight: boolean;
    status?: number;
}

export interface Status {
    id: number;
    name: string;
    class: string;
    is_list: boolean;
}