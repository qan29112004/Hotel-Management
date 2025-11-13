import {
    Component,
    inject,
    ViewChild,
    OnInit,
    ElementRef,
    OnDestroy,
    AfterViewInit,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatBubbleComponent } from '../../../../shared/components/chat-bubble/chat-bubble.component';
import { ChatBubbleConfig } from '../../../../shared/components/chat-bubble/chat-bubble.types';
import { ChatRoom, Message } from '../../../../core/chat/chat.types';
import { ChatService } from '../../../../core/chat/chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'app/core/profile/user/user.service';
import {
    Subscription,
    combineLatest,
    Subject,
    firstValueFrom,
    take,
} from 'rxjs';
import {
    distinctUntilChanged,
    map,
    switchMap,
    tap,
    takeUntil,
    first,
    finalize,
} from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import {
    Timestamp,
    getFirestore,
    writeBatch,
    doc,
    getDoc,
    updateDoc,
} from '@angular/fire/firestore';
import { ChatRoomDeActivate } from '../../../../core/chat/chat.types';
import { waitImageUploadUtil } from 'app/shared/utils/chat/wait_image_upload.util';
import { MatIconModule } from '@angular/material/icon';
import { BaseChatComponent } from '../base-chat/base-chat.component';
import { MicButtonComponent } from 'app/shared/components/mic/mic-button.component';
import { AudioWaveComponent } from 'app/shared/components/mic/audio-wave.component';

@Component({
    selector: 'app-chat-content',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ChatBubbleComponent,
        MatIconModule,
        MicButtonComponent,
        AudioWaveComponent,
    ],
    templateUrl: './chat-content.component.html',
    styles: ``,
})
export class ChatContentComponent
    extends BaseChatComponent
    implements ChatRoomDeActivate, OnDestroy
{
    private focusHandler = this.handleFocus.bind(this);
    private blurHandler = this.handleBlur.bind(this);
    private unloadHandler = this.handleUnload.bind(this);
    

    private async handleFocus() {
        if (!this.chatRoomData || !this.user) return; // Bảo vệ chống lại gọi sau khi hủy
        const idChat = this._route.snapshot.paramMap.get('id');
        const docRef = doc(this.firestore, 'sessionChats', idChat);
        const docSnap = await getDoc(docRef);
        let userAccess = docSnap.data().userAccess;
        let userAccessCopy = { ...userAccess };
        delete userAccessCopy[this.user.username];
        await updateDoc(docRef, { userAccess: userAccessCopy });
    }

    private async handleBlur() {
        if (!this.chatRoomData || !this.user) return; // Bảo vệ
        const idChat = this._route.snapshot.paramMap.get('id');
        const docRef = doc(this.firestore, 'sessionChats', idChat);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data() as ChatRoom;
        data.userAccess[this.user.username] = Timestamp.now();
        await updateDoc(docRef, { userAccess: data.userAccess });
    }

    private handleUnload() {
        if (this.chatRoomData && this.user) {
            const currentValue = Number(
                localStorage.getItem(
                    `${this.chatRoomData.chatRoomId}_${this.user.id}`
                )
            );
            if (currentValue >= 1) {
                const newValue = currentValue - 1;
                localStorage.setItem(
                    `${this.chatRoomData.chatRoomId}_${this.user.id}`,
                    String(newValue)
                );

                console.log('DIEU KIEN: ', newValue === 0);
                if (newValue === 0) {
                    console.log('XOA LOCALSTORAGE');
                    localStorage.removeItem(
                        `${this.chatRoomData.chatRoomId}_${this.user.id}`
                    );
                    const db = this.firestore;
                    const batch = writeBatch(db);
                    const docRef = doc(
                        db,
                        this.chatService['_chatRoom'],
                        this.chatRoomData.chatRoomId
                    );

                    batch.update(docRef, {
                        [`userAccess.${this.user.username}`]: Timestamp.now(),
                    });

                    // Thực thi batch đồng bộ
                    batch.commit();
                }
            }
        }
    }

    initialize() {
        this.chatService
            .getAdminInfor()
            .pipe(
                tap((adminList: any) => {
                    if (!adminList || adminList.length === 0) {
                        throw new Error(
                            'No admin document found in admin collection'
                        );
                    }
                    this.adminData = adminList[0];
                })
            )
            .subscribe({
                next: () => {
                    console.log('ADMIN DATA EMAIL: ', this.adminData.email);
                },
                error: (err) => {
                    console.error(err);
                },
            });
        // const navigation = this._router.getCurrentNavigation();
        // this.state = navigation?.extras.state;

        // if (!this.state) {
        //   this.state = history.state;
        // }

        // console.log("STATE: ",this.state?.expandedUserId)

        this._route.paramMap
            .pipe(
                map((params) => params.get('id')),
                distinctUntilChanged(),
                tap(() => {
                    this.chats = [];
                    this.isLoadingChat = true;
                    const navigation = this._router.getCurrentNavigation();
                    if (navigation?.extras.state) {
                        this.state = navigation.extras.state;
                        console.log(
                            'NEW STATE from navigation: ',
                            this.state?.expandedUserId
                        );
                    } else if (history.state) {
                        this.state = history.state;
                        console.log(
                            'NEW STATE from history: ',
                            this.state?.expandedUserId
                        );
                    }
                    console.log('USER STATE: ', this.state?.inforUser),
                        console.log('ADMIN STATE: ', this.state?.inforAdmin);
                }),
                switchMap((chatId) =>
                    this._user.user$.pipe(
                        tap((user) => {
                            this.user = user;
                            this.chatService.idChatRoom = chatId;
                            this.chatService.getChatRoom(
                                chatId,
                                user.username,
                                false
                            );
                        }),
                        switchMap(() => this.chatService.chatRoomSubject),
                        tap((chatroom) => {
                            console.log('CHAT ROOM:', chatroom);
                            // window.addEventListener('focus', this.focusHandler);
                            // window.addEventListener('blur', this.blurHandler);
                            window.addEventListener(
                                'unload',
                                this.unloadHandler
                            );
                            this.chatRoomData = chatroom;
                            this.crrNameChatRoom = this.chatRoomData.title;
                            this.isResponding = false;
                            const idPresenceChat = `${chatroom.chatRoomId}_${this.user.id}`;

                            if (
                                !this.crrChatRoomId ||
                                (this.crrChatRoomId &&
                                    this.crrChatRoomId !==
                                        this.chatRoomData.chatRoomId)
                            ) {
                                const presenceChat: number = Number(
                                    localStorage.getItem(idPresenceChat) || '0'
                                );
                                localStorage.setItem(
                                    idPresenceChat,
                                    String(presenceChat + 1)
                                );
                                this.crrChatRoomId =
                                    this.chatRoomData.chatRoomId;
                                this.getAllChatsOfSession(this.user);
                            }
                        })
                    )
                ),
                takeUntil(this._destroy$)
            )
            .subscribe();
        if (this._messagesSub) {
            this._messagesSub.unsubscribe();
        }

        this._messagesSub = this.chatService.messagesChatRoom.subscribe(
            (messages) => {
                console.log('MESSAGES:', messages);
                console.log(
                    'CHECK DIEU KIEN: ',
                    this.chatService.isAddNewChat && messages.length === 1
                );
                console.log(
                    'CHECK DIEU KIEN 1: ',
                    this.chatService.isAddNewChat
                );
                console.log('CHECK DIEU KIEN 2: ', messages.length === 1);
                if (messages.length === 0 && this.chats.length === 0) {
                    this.isLoadingChat = false;
                    console.log('KHONG CO CHAT NAO');
                } else if (this.chats.length === 0) {
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
                    const newScrollHeight =
                        this.chatContainer.nativeElement.scrollHeight;
                    console.log('CHATS CŨ:', oldMessages);
                    console.log('CHATS MỚI:', this.chats);
                    console.log('OLD SCROLL HEIGHT:', prevBottomOffset);
                    // this.isLoadingMore = false;
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

    ExitChatRoom(): void {
        console.log('CHAY HAM EXIT CHAT ROOM');
        if (this.chatRoomData && this.user) {
            this.chatService.UpdateChatRoom(
                this.chatRoomData.chatRoomId,
                this.user.username
            );
            const crrValue =
                Number(
                    localStorage.getItem(
                        `${this.chatRoomData.chatRoomId}_${this.user.id}`
                    )
                ) - 1;
            if (crrValue === 0) {
                localStorage.removeItem(
                    `${this.chatRoomData.chatRoomId}_${this.user.id}`
                );
            } else {
                localStorage.setItem(
                    `${this.chatRoomData.chatRoomId}_${this.user.id}`,
                    String(crrValue)
                );
            }
        }
    }

    getAllChatsOfSession(user: any) {
        console.log('CHAY HAM GET ALL CHAT');

        console.log('LOADING CHAT: ', this.isLoadingChat);
        if (!this.chatRoomData) {
            console.log('RETURN không có chatRoomData');
            return;
        }
        // this.chats = [];
        this.chatService.getLimitChatOfChatRoom(
            this.chatRoomData.chatRoomId,
            false,
            this.pageSize,
            true
        );
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

    testCompareTime(chats: any) {
        let i: number;
        for (i = 0; i < chats.length; i++) {
            console.log('LAN ', i);
            if (chats[i - 1]) {
                console.log(
                    this.compareDates(
                        this.formatTimestamp(chats[i - 1].timestamp)[0],
                        this.formatTimestamp(chats[i].timestamp)[0]
                    )
                );
            }
        }
    }

    clickChevronLeft() {
        this.chatService.hiddenListUsers = false;
    }

    ngOnDestroy(): void {
        window.removeEventListener('focus', this.focusHandler);
        window.removeEventListener('blur', this.blurHandler);
        window.removeEventListener('unload', this.unloadHandler);

        super.ngOnDestroy();
    }
    
}
