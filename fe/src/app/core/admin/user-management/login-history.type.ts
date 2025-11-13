import { User } from './user-management.types';

export default interface LoginHistory {
    time: Date;
    ip: String;
    browser: String;
    device: String;
    user: User;
}
