import {
    Component,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    OnInit,
    Output,
    ViewChild,
    OnChanges,
    SimpleChanges,
    OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatBubbleConfig } from 'app/shared/components/chat-bubble/chat-bubble.types';
import { ChatBubbleComponent } from 'app/shared/components/chat-bubble/chat-bubble.component';
import { finalize, switchMap, takeUntil, tap, filter } from 'rxjs/operators';
import { firstValueFrom, Subject, Subscription, take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { Message } from 'app/core/chat/chat.types';
import { waitImageUploadUtil } from 'app/shared/utils/chat/wait_image_upload.util';
import { MatIconModule } from '@angular/material/icon';
import { BaseChatComponent } from '../../base-chat/base-chat.component';
import { MicButtonComponent } from 'app/shared/components/mic/mic-button.component';
import { AudioWaveComponent } from 'app/shared/components/mic/audio-wave.component';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [
        CommonModule,
        ChatBubbleComponent,
        ReactiveFormsModule,
        MatIconModule,
        MicButtonComponent,
        AudioWaveComponent,
        A11yModule,
    ],
    templateUrl: './chat-widget.component.html',
    styles: ``,
})
export class ChatWidgetComponent
    extends BaseChatComponent
    implements OnChanges, OnDestroy
{
    idChatWidget: any;
    @Input() isOpenChatBot: boolean = false;
    @Output() closeChat = new EventEmitter<void>();

    protected initialize(): void {
        console.log('CHAT WIDGET INIT');
        this.chatService.getAdminInfor().subscribe({
            next: (response) => {
                // this.adminData = response.map(adminInfor => ({
                //   id: adminInfor.id,
                //   username: adminInfor.username,
                //   avatar: adminInfor.avatar,
                // }));
                this.adminData = response[0];
                this.chatService.adminData = response[0];
                console.log('ADMINDATA: ', this.adminData);
            },
            error: (error) => {
                console.error('Error fetching admin info:', error);
            },
        });
        // Initialize admin data first
        this.chatService
            .initializeAdminData()
            .pipe(
                tap((adminData) => {
                    this.chats = [];
                    this.isLoadingChat = true;
                    console.log('DATA ADMIN: ', adminData);
                }),
                switchMap(() => this._user.user$),
                tap(async (user) => {
                    this.user = user;
                    console.log('USER:', user);

                    this.chatService
                        .getIdUser(this.user)
                        .pipe(
                            switchMap((crrUserFBId) => {
                                return this.chatService.getChatRoomIdByUserId(
                                    crrUserFBId
                                );
                            }),
                            takeUntil(this._destroy$)
                        )
                        .subscribe({
                            next: (chatId) => {
                                console.log(
                                    'CHAT ID SAU KHI CHAY HAM: ',
                                    chatId
                                );
                                if (chatId) {
                                    localStorage.setItem(
                                        'idChatWidget',
                                        chatId
                                    );
                                    this.idChatWidget = chatId;
                                    console.log(
                                        'id chat widget: ',
                                        this.idChatWidget
                                    );
                                    this.chatService.getChatRoom(
                                        chatId,
                                        user.username,
                                        true
                                    );
                                }
                            },
                            error: (error) => {
                                console.error(
                                    'Error getting chat room ID:',
                                    error
                                );
                            },
                        });
                }),
                switchMap(() => this.chatService.chatRoomSubject),
                tap((chatRoom) => {
                    console.log('CHAT ROOM:', chatRoom);
                    this.chatRoomData = chatRoom;
                    if (this.initialChatRoom === false) {
                        this.initialChatRoom = true;
                        this.getAllChatsOfSession(this.user);
                    }
                }),
                takeUntil(this._destroy$)
            )
            .subscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (
            changes['isOpenChatBot'] &&
            changes['isOpenChatBot'].currentValue === true
        ) {
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
        }
    }

    async addMessage() {
        this.resetHeight();
        this.isImage = undefined;
        if (this.isSending) {
            console.log('DANG GUI');

            return;
        }
        this.isSending = true;
        console.log('FORM VALID: ', this.form.valid);
        if (!this.form.valid || !this.chatRoomData) {
            console.log(this.chatRoomData);
            return;
        }
        const message = this.form.get('message').value
            ? this.form.get('message').value.trim()
            : '';
        const file = this.selectedFile ? this.selectedFile : [];
        if (!message && !file.length) {
            this.isSending = false;
            return;
        }

        this.scrollToBottom();

        const now = Timestamp.fromDate(new Date());
        this.form.reset();

        this.imagePreview = [];
        this.isUploading = true;
        this.chatService
            .uploadFilesToFirebase(
                this.selectedFile,
                this.chatRoomData.chatRoomId
            )
            .pipe(
                takeUntil(this._destroy$),
                finalize(() => {
                    this.isUploading = false;
                })
            )
            .subscribe({
                next: (urls) => {
                    this.urlFiles = urls;
                },
                error: (error) => {
                    console.error('Error uploading files:', error);
                    this.urlFiles = [];
                },
            });

        if (file.length > 0) {
            await firstValueFrom(
                waitImageUploadUtil(
                    () =>
                        (!this.isUploading &&
                            this.urlFiles &&
                            this.urlFiles.length >= file.length) ||
                        !this.isUploading
                )
            );
        }
        const crrChatRoom = this.chatRoomData;

        const messageUpload: Message = {
            senderUser: this.user.id,
            text: message,
            timestamp: now,
            role: String(this.user.role),
            urlFile: this.urlFiles || [],
        };
        await this.chatService.addMessage(
            crrChatRoom.chatRoomId,
            messageUpload,
            this.user,
            this.state?.expandedUserId
        );

        // Chỉ gọi ChatBot nếu KHÔNG có file
        if (
            messageUpload.role === '3' &&
            (file.length === 0 || (message && file.length > 0))
        ) {
            this.isResponding = true;
            this.scrollToBottom();
            this.chatService
                .chatBot(message)
                .pipe(
                    takeUntil(this._destroy$),
                    finalize(() => {
                        this.isResponding = false;
                    })
                )
                .subscribe((response) => {
                    this.scrollToBottom();
                    const messageChatBot: Message = {
                        senderUser: crrChatRoom.adminId,
                        text: response,
                        timestamp: Timestamp.fromDate(new Date()),
                        role: String(1),
                        urlFile: [],
                    };
                    console.log(
                        'ADMIN DATA BEFORE ADDMESSAGE: ',
                        this.adminData
                    );
                    this.chatService.addMessage(
                        crrChatRoom.chatRoomId,
                        messageChatBot,
                        this.adminData,
                        this.state?.expandedUserId
                    );
                });
        }
        this.selectedFile = [];
        this.urlFiles = [];
        this.isSending = false;
    }

    emitCloseChat() {
        this.closeChat.emit();
    }

    openNewTab() {
        const chatRoomId = this.chatRoomData
            ? this.chatRoomData.chatRoomId
            : null;
        if (chatRoomId) {
            window.open(`/chat/${chatRoomId}`, '_blank');
        } else {
            console.error('No chat room available to open in new tab.');
        }
    }

    getAllChatsOfSession(user: any) {
        console.log('CHAY HAM GET ALL CHAT');
        if (!this.chatRoomData) {
            console.log('RETURN không có lathis.chatRoomData');
            return;
        }
        // this.chats = [];
        this.chatService.getLimitChatOfChatRoom(
            this.chatRoomData.chatRoomId,
            true,
            this.pageSize,
            true
        );
        if (this._messagesSub) {
            this._messagesSub.unsubscribe();
        }

        this._messagesSub = this.chatService.messagesChatRoom.subscribe(
            (messages) => {
                console.log('MESSAGES:', messages);
                if (messages.length === 0) {
                    this.isLoadingChat = false;
                }
                if (this.chats.length === 0) {
                    this.chats = messages
                        .map(
                            (item) =>
                                ({
                                    id: item.id,
                                    text: item.text,
                                    urlFile: item.urlFile,
                                    position:
                                        item.role === String(this.user.role)
                                            ? 'right'
                                            : 'left',
                                    timestamp: item.timestamp,
                                    time: this.formatTimestamp(item.timestamp),
                                } as ChatBubbleConfig)
                        )
                        .sort((a, b) => {
                            const getTime = (item: any) =>
                                item.timestamp.toDate().getTime();
                            return getTime(a) - getTime(b);
                        });
                    this.isLoadingChat = false;
                    console.log('CHATS INITIAL:', this.chats);
                    this.scrollToBottom();
                } else if (
                    this.chats &&
                    this.chatService.isAddNewChat &&
                    messages.length === 1
                ) {
                    console.log('THEM MESSAGE MOI');
                    messages.forEach((item) => {
                        // Kiểm tra xem message đã tồn tại chưa để tránh duplicate
                        const existingMessage = this.chats.find(
                            (chat) => chat.id === item.id
                        );
                        if (!existingMessage) {
                            const newChat = {
                                id: item.id,
                                text: item.text,
                                urlFile: item.urlFile,
                                position:
                                    item.role === String(this.user.role)
                                        ? 'right'
                                        : 'left',
                                timestamp: item.timestamp,
                                time: this.formatTimestamp(item.timestamp),
                            } as ChatBubbleConfig;
                            this.chats.push(newChat);
                            this.chatService.isAddNewChat = false; // Reset trạng thái sau khi thêm
                            console.log(
                                'CHATS SAU KHI SENDMESSAGE: ',
                                this.chats
                            );
                            this.scrollToBottom();
                        } else {
                            console.log('Message đã tồn tại, bỏ qua:', item.id);
                        }
                    });
                } else if (this.chats) {
                    const container = this.chatContainer.nativeElement;
                    const prevBottomOffset =
                        container.scrollHeight - container.scrollTop;
                    const oldMessages = messages
                        .map(
                            (item) =>
                                ({
                                    id: item.id,
                                    text: item.text,
                                    urlFile: item.urlFile,
                                    position:
                                        item.role === String(this.user.role)
                                            ? 'right'
                                            : 'left',
                                    timestamp: item.timestamp,
                                    time: this.formatTimestamp(item.timestamp),
                                } as ChatBubbleConfig)
                        )
                        .sort((a, b) => {
                            const getTime = (item: any) =>
                                item.timestamp.toDate().getTime();
                            return getTime(a) - getTime(b);
                        });
                    this.chats = [...oldMessages, ...this.chats];
                    console.log('CHATS CŨ:', oldMessages);
                    console.log('CHATS MỚI:', this.chats);
                    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
                        const newScrollHeight = container.scrollHeight;
                        const targetScrollTop =
                            newScrollHeight - prevBottomOffset;
                        container.style.overflowY = 'hidden'; // Disable scrolling while loading
                        container.scrollTop = targetScrollTop;
                        requestAnimationFrame(() => {
                            container.scrollTop = targetScrollTop; // Force set lại
                            container.style.overflowY = 'auto'; // Enable scrolling sau loading
                            container.style.overscrollBehavior = 'contain'; // Inline CSS nếu không có class
                            this.isLoadingMore = false; // Reset flag
                        });
                    });
                }
            }
        );
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
