import { Time } from "@angular/common";
import { Timestamp } from "@angular/fire/firestore";
import { UploadTask } from "@angular/fire/storage";

export interface Message{
    id?:string;
    text: string;
    timestamp?: Timestamp;        
    role:string;
    urlFile?:string[] | []
}
export interface ChatRoom{
    chatRoomId?: string                       
    userId: any;
    adminId: any;   
    title:string;
    createAt: Date;
    lastUpdate: Timestamp;                  
    lastMessage?: string;                 
    lastMessageTimestamp?: Timestamp;  
    userAccess: any[];     
    senderName:string;
    userFBId:any;
}

export interface ChatRoomDeActivate{
    ExitChatRoom():void;
}

export interface FileUpload {
    file: File;
    uploadTask?: UploadTask;
    storageRef?: any;
    status: 'uploading' | 'uploaded' | 'urlFetched' | 'canceled';
    url?: string;
}

type action = 'join_group'| 'out_group'| 'send_message'| 'send_requirement' | 'send_message_ai'

export interface MessageSocket{
    action:action
    text?:string
    sender?:string
    group_name?:string
}