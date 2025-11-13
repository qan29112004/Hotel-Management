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
        if (
            container.scrollTop === 0 &&
            this.chatService.isLoadMoreMessage &&
            !this.isLoadingMore
        ) {
            this.isLoadingMore = true;
            await this.chatService.getLimitChatOfChatRoom(
                this.chatRoomData.chatRoomId,
                false,
                this.pageSize,
                false
            );
        }
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
    protected startRecording() {
        this.isCancelled = false; // reset khi bắt đầu
        this.form.disable({ emitEvent: false });

        // 🔹 Kiểm tra thiết bị micro trước
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const hasMic = devices.some((d) => d.kind === 'audioinput');

                if (!hasMic) {
                    // 🚫 Không có thiết bị micro → hiện alert
                    this.isRecording = false;
                    this.form.enable({ emitEvent: false });

                    this._alertService.showAlert({
                        title: this.translocoService.translate(
                            'other.error_title'
                        ),
                        message: this.translocoService.translate(
                            'errors.no_microphone'
                        ),
                        type: 'error',
                    });
                    return;
                }

                // ✅ Nếu có mic thì xin quyền và bắt đầu ghi âm
                navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then((stream) => {
                        this.isRecording = true;
                        this.mediaRecorder = new MediaRecorder(stream);
                        this.audioChunks = [];

                        this.mediaRecorder.ondataavailable = (event) => {
                            this.audioChunks.push(event.data);
                        };

                        let mimeType = '';
                        let fileExtension = 'webm'; // default fallback

                        if (MediaRecorder.isTypeSupported('audio/webm')) {
                            mimeType = 'audio/webm';
                            fileExtension = 'webm';
                        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                            mimeType = 'audio/mp4';
                            fileExtension = 'mp4';
                        } else if (MediaRecorder.isTypeSupported('audio/m4a')) {
                            mimeType = 'audio/m4a';
                            fileExtension = 'm4a';
                        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                            mimeType = 'audio/wav';
                            fileExtension = 'wav';
                        } else if (
                            MediaRecorder.isTypeSupported('audio/mpeg')
                        ) {
                            mimeType = 'audio/mpeg';
                            fileExtension = 'mp3';
                        } else if (
                            MediaRecorder.isTypeSupported('audio/mpga')
                        ) {
                            mimeType = 'audio/mpga';
                            fileExtension = 'mpga';
                        }

                        this.mediaRecorder = new MediaRecorder(stream, {
                            mimeType,
                        });
                        this.audioChunks = [];

                        this.mediaRecorder.ondataavailable = (event) => {
                            this.audioChunks.push(event.data);
                        };

                        this.mediaRecorder.onstop = () => {
                            if (this.isCancelled) return; // không gọi processAudio
                            const audioBlob = new Blob(this.audioChunks, {
                                type: mimeType,
                            });
                            this.processAudio(audioBlob, fileExtension);
                        };

                        this.mediaRecorder.onerror = () => {
                            this.isRecording = false;
                            this.isProcessing = false;
                            this.form.enable({ emitEvent: false });
                        };

                        this.mediaRecorder.start();
                    })
                    .catch((err) => {
                        this.isRecording = false;
                        this.form.enable({ emitEvent: false });

                        // Nếu user từ chối quyền mic
                        this._alertService.showAlert({
                            title: this.translocoService.translate(
                                'other.error_title'
                            ),
                            message: this.translocoService.translate(
                                'audio.microphone_permission_denied'
                            ),
                            type: 'error',
                        });
                    });
            })
            .catch((err) => {
                // Lỗi khi enumerateDevices (hiếm gặp)
                this.isRecording = false;
                this.form.enable({ emitEvent: false });
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: 'Không thể kiểm tra thiết bị micro.',
                    type: 'error',
                });
            });
    }

    onCancelRecording() {
        this.isCancelled = true; // ✅ set flag
        this.isRecording = false;
        this.isProcessing = false;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop(); // onstop vẫn gọi, nhưng sẽ bị chặn bởi flag
        }

        this.form.enable({ emitEvent: false });
        this.audioChunks = [];
    }

    onStopRecording() {
        // Người dùng bấm send
        this.isRecording = false;
        this.isProcessing = true;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop(); // Khi stop → onstop sẽ gọi processAudio()
        }
    }

    protected processAudio(audioBlob: Blob, fileExtension: string = 'webm') {
        this.isProcessing = true;

        const formData = new FormData();
        const fileName = `recording.${fileExtension}`;
        formData.append('file', audioBlob, fileName);

        this.chatService.uploadAudio(formData).subscribe({
            next: (res) => {
                // ✅ backend trả về data.text
                this.form.patchValue({ message: res.data.text });
                this.isProcessing = false;
                this.form.enable({ emitEvent: false });
            },
            error: (err) => {
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('errors.default'),
                    type: 'error',
                });
                this.isProcessing = false;
                this.form.enable({ emitEvent: false });
            },
        });
    }
}
