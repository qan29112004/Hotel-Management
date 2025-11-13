export interface Product {
    id: string;
    name: string;
    price: number;
    discount: number;
    phone: string ;
    describe: string;
    suplier: string ;
    productStatus: String;
    status: String;
    category: Category;
    img: string[];
    createdBy: createdBy;
    createdAt: Date;
    approver: string ;
    realPrice:any
}
export interface createdBy {
    id: string;
    username: string;
    avatar?: string;
};
export interface Category{
        id: number;
        name: string;
};

