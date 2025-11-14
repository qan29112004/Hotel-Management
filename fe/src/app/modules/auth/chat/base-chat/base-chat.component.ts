import {
    Component,
    inject,
    ViewChild,
    OnInit,
    ElementRef,
    OnDestroy,
    AfterViewInit,
    Input,
    NgZone,
    HostListener,
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
import { Subscription, combineLatest, Subject, firstValueFrom } from 'rxjs';
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
import { Timestamp, Firestore } from '@angular/fire/firestore';
import { ChatRoomDeActivate } from '../../../../core/chat/chat.types';
import { waitImageUploadUtil } from 'app/shared/utils/chat/wait_image_upload.util';
import { MatIconModule } from '@angular/material/icon';
import { formatTimestamp } from 'app/shared/utils/chat/format_time.util';
import { compareDates } from 'app/shared/utils/chat/compare_time.util';
import { initial, isBuffer } from 'lodash';
import { AlertService } from 'app/core/alert/alert.service';

@Component({
    selector: 'app-base-chat',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './base-chat.component.html',
    styles: ``,
})
export abstract class BaseChatComponent implements OnDestroy {
    chatRoomData!: ChatRoom;
    user: any;
    state: any;
    pageSize: number = 10;
    isLoadingChat: boolean = false;
    isLoadingMore: boolean = false;
    adminData: any;
    isCreateChat: boolean = false;
    userInforFromFireBase: any;
    responseChatBot: string;
    crrNameChatRoom: string;
    isImage: boolean;
    isWarning: boolean;
    crrChatRoomId: any;
    initialChatRoom: boolean = false;
    protected _route = inject(ActivatedRoute);
    protected _router = inject(Router);
    protected translocoService = inject(TranslocoService);
    chats: any[];
    form: FormGroup = new FormGroup({
        message: new FormControl(''),
        file: new FormControl(null),
    });
    protected ngZone = inject(NgZone);
    protected firestore = inject(Firestore);
    protected chatService = inject(ChatService);
    protected _user = inject(UserService);
    protected _messagesSub: Subscription;
    protected _userSub: Subscription;
    protected _chatRoomSub: Subscription;
    protected _destroy$ = new Subject<void>();
    isResponding: boolean = false;
    @ViewChild('inputFile') inputFile: ElementRef<HTMLInputElement>;
    @ViewChild('inputText') inputText: ElementRef<HTMLTextAreaElement>;
    @ViewChild('chatContainer') chatContainer: ElementRef<HTMLDivElement>;
    @Input() infoUser: any;
    isRecording = false;
    isProcessing = false;

    mediaRecorder!: MediaRecorder;
    audioChunks: BlobPart[] = [];

    selectedFile: File[] = [];
    imagePreview: { fileName: string; previewUrl: string }[] = []; // Change type to store both name and URL
    urlFiles: any[];
    isSending = false;
    isUploading: boolean = false; // Trạng thái đang upload
    private isCancelled = false;

    // ngOnInit(): void {
    //   this.initialize();
    // }
    constructor(protected _alertService: AlertService) {
        this.initialize();
    }
    protected abstract initialize(): void;

    protected formatTimestamp = formatTimestamp;

    protected compareDates = compareDates;

    protected TriggerInputFile() {
        this.inputFile.nativeElement.click();
        setTimeout(() => {
            this.inputText.nativeElement.focus();
        }, 100);
    }
    protected scrollToBottom() {
        setTimeout(() => {
            if (this.chatContainer && this.chatContainer.nativeElement) {
                this.chatContainer.nativeElement.scrollTop =
                    this.chatContainer.nativeElement.scrollHeight;
            }
        }, 0);
    }

    protected async onScroll() {
        const container = this.chatContainer.nativeElement;
    }

    protected onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.addMessage();
        }
    }

    protected resetHeight() {
        this.inputText.nativeElement.style.height = '40px';
    }

    protected autoGrow(textarea: HTMLTextAreaElement): void {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    get messageValue() {
        return this.form.get('message')?.value;
    }
    protected async InputChangeFile(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            Array.from(input.files).forEach((file) => {
                if (file.type.startsWith('image/')) {
                    this.selectedFile.push(file);

                    const reader = new FileReader();
                    reader.onload = (e: any) => {
                        if (e.target.result) {
                            this.imagePreview.push({
                                fileName: file.name,
                                previewUrl: e.target.result,
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                    this.isImage = true;
                } else {
                    this.isImage = false;
                    setTimeout(() => {
                        this.isImage = true;
                    }, 2000);

                    console.warn(`File ${file.name} không phải định dạng ảnh.`);
                }
            });
        }
        input.value = '';
    }

    protected removeSelectedFile(fileName: string) {
        const index = this.imagePreview.findIndex(
            (item) => item.fileName === fileName
        );
        if (index !== -1) {
            this.selectedFile.splice(index, 1);
            this.imagePreview.splice(index, 1);
        }
        if (this.imagePreview.length === 0) {
            this.isImage = undefined;
        }
    }

    protected abstract getAllChatsOfSession(user: any);
    protected abstract addMessage();

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
        if (this._messagesSub) {
            this._messagesSub.unsubscribe();
        }
        if (this._userSub) {
            this._userSub.unsubscribe();
        }
        if (this._chatRoomSub) {
            this._chatRoomSub.unsubscribe();
        }
    }
}
