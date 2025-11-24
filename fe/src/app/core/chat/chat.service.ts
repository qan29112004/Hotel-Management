import { Injectable, inject } from '@angular/core';

import { UserService } from 'app/core/profile/user/user.service';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../uri/config';
import { ChatRoom, Message, FileUpload } from './chat.types';
import {
    catchError,
    from,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    tap,
    throwError,
    forkJoin,
    concat,
    reduce,
    BehaviorSubject,
    interval 
} from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { UserChatConfig } from 'app/shared/components/user-card-chat/user-card-chat.types';
import {
    filter,
    firstValueFrom,
    Subscription,
    combineLatest,
    startWith,
} from 'rxjs';
import { NgxImageCompressService } from 'ngx-image-compress';
import { Router } from '@angular/router';
import imageCompression from 'browser-image-compression';
import { TranslocoService } from '@ngneat/transloco';
import { chunkArray } from 'app/shared/utils/chat/chunk_array.util';
import { User } from '../profile/user/user.types';
@Injectable({
    providedIn: 'root',
})
export class ChatService {

    isLoadMoreMessage: boolean = true;
    isMobile: boolean = false;
    isOpenChatBot: boolean = false;
    user: any;
    private _translocoService = inject(TranslocoService);
    private _userService = inject(UserService);
    private _oldestDoc: any;
    private _newestDoc: any;
    private _messages: Message[];
    userSubjects: BehaviorSubject<any[]> = new BehaviorSubject([]);
    sessionChatSubject: Subject<any[]> = new Subject();
    chatRoomSubject: Subject<ChatRoom> = new Subject();
    messagesChatRoom: Subject<Message[]> = new Subject();
    lastChatRoom: Subject<ChatRoom> = new Subject();
    userChats: UserChatConfig[] = [];

    private socket$: WebSocketSubject<any> | null = null;
    private messagesSubject$ = new Subject<any>();
    public messages$ = this.messagesSubject$.asObservable();

    private reconnectInterval = 5000; // 5 giây
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;

    constructor(private http:HttpClient) {}

    /**
     * Kết nối đến WebSocket server
     */
    connect(url?: string): void {
        const accessToken = localStorage.getItem('accessToken')
        if (accessToken){
            if (!this.socket$ || this.socket$.closed) {
            this.socket$ = webSocket({
                url: uriConfig.WEBSOCKET_URL + `?token=${accessToken}`,
                openObserver: {
                next: () => {
                    console.log('WebSocket connected!');
                    this.reconnectAttempts = 0;
                }
                },
                closeObserver: {
                next: () => {
                    console.log('WebSocket disconnected!');
                    this.socket$ = null;
                    this.reconnect(url);
                }
                }
            });

            this.socket$.subscribe({
                next: (message) => this.messagesSubject$.next(message),
                error: (error) => {
                console.error('WebSocket error:', error);
                this.reconnect(url);
                }
            });
            }
        }
    }

    /**
     * Tự động kết nối lại khi bị ngắt
     */
    private reconnect(url: string): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        
        setTimeout(() => {
            this.connect(url);
        }, this.reconnectInterval);
        } else {
        console.error('Max reconnection attempts reached');
        }
    }

    /**
     * Gửi message đến server
     * @param message - Dữ liệu cần gửi
     */
    sendMessage(message: any): void {
        if (this.socket$) {
        this.socket$.next(message);
        } else {
        console.error('WebSocket is not connected');
        }
    }

    /**
     * Đóng kết nối WebSocket
     */
    disconnect(): void {
        if (this.socket$) {
        this.socket$.complete();
        this.socket$ = null;
        }
    }

    /**
     * Kiểm tra trạng thái kết nối
     */
    isConnected(): boolean {
        return this.socket$ !== null && !this.socket$.closed;
    }

    getAllMessage(payload:any):Observable<any>{
        return this.http.post<any>(uriConfig.API_GET_MESSAGE,payload).pipe(
            map(res=>({
                group:res.data.group,
                messages:res.data.messages,
                groupStatus:res.data.groupStatus,
                memberCount:res.data.memberCount
            }))
        )
    }
    getAllRequirementChat():Observable<any>{
        return this.http.get<any>(uriConfig.API_GET_REQUIREMENT_SUPPORT_CHAT).pipe(
            map(res=>({
                requirements: res.data.requirements,
                isJoin:res.data.isJoin
            }))
        )
    }
}
