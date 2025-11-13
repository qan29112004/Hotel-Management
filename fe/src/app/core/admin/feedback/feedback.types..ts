export interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface Feedback {
  id: number;
  title: string;
  content: string;
  createdBy: User;
  updatedBy?: User;
  createdAt: Date;
  updatedAt?: Date;
  selected?: boolean;
}
