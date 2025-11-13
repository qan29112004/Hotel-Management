export interface DashBoard{
    id? : number;
    year: number;
    month: number ;
    totalUserLogin: number;
    created_at: string;
}
export interface User {
  id: number;
  username: string;
  created_at: string;
}
export interface Post {
  id: number;
  categories: number;
  created_at: string;   
  updated_at: string;   
  created_by: string;
  content: string;
  like_account: number;
  image: string ;
}