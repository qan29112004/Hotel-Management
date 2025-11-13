export interface UserChatConfig{
    chatRoomId: any,
    crrUserId: any;
    fullName:string,
    time: string;
    lastMessage:string;
    onClick?: () => any;
    isActive: boolean;
    unreadCount: boolean;
}