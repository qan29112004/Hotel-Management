export interface News
{
    id: number;
    title: string;
    slug: string;
    content: string;
    thumbnail: string;
    category: {
        id: number;
        name: string;
        slug: string;
    };
    categories: any[];
    images: any[],
    attachments: any[],
    createdBy: {
        id: number;
        username: string;
        fullName: string;
        avatar: string;
    };
    updatedBy: {
        id: number;
        username: string;
        fullName: string;
        avatar: string;
    };
    likedBy: {
        user: any[],
        total: number
    };
    created_at: string;
    updated_at: string;
    status?: number;
}

export interface Status {
    id: number;
    name: string;
    class: string;
    is_list: boolean;
}

export interface NewsComment {
    id: number;
    news: number;
    parent: number;
    user: User,
    content: string;
    image: string;
    likedBy: LikedBy;
    createdAt: string;
    replies: NewsComment[];
}

interface LikedBy {
    user: {
      id: number;
      username: string;
      avatar?: string | null;
      fullName?: string | null;
    }[];
    total: number;
}

interface User {
    id: number;
    username: string;
    avatar?: string | null;
    fullName?: string | null;
}
