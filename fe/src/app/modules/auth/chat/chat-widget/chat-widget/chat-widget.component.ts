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
    OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatBubbleConfig } from 'app/shared/components/chat-bubble/chat-bubble.types';
import { ChatBubbleComponent } from 'app/shared/components/chat-bubble/chat-bubble.component';
import { finalize, switchMap, takeUntil, tap, filter } from 'rxjs/operators';
import { firstValueFrom, Subject, Subscription, take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Message, MessageSocket } from 'app/core/chat/chat.types';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@ngneat/transloco';
import { compareDates } from 'app/shared/utils/chat/compare_time.util';
import { formatTimestamp } from 'app/shared/utils/chat/format_time.util';
import { ChatService } from 'app/core/chat/chat.service';
import { UserService } from 'app/core/profile/user/user.service';

@Component({
    selector: 'app-chat-widget',
    standalone: true,
    imports: [
        CommonModule,
        ChatBubbleComponent,
        ReactiveFormsModule,
        MatIconModule,
    ],
    templateUrl: './chat-widget.component.html',
    styles: ``,
})
export class ChatWidgetComponent implements OnInit, OnDestroy
{
    compareDates = compareDates;
    formatTimestamp = formatTimestamp;
    translocoService = inject(TranslocoService);
    idChatWidget: any;
    @Input() isOpenChatBot: boolean = false;
    @Output() closeChat = new EventEmitter<void>();
    @ViewChild('inputText') inputText: ElementRef<HTMLTextAreaElement>;
    @ViewChild('chatContainer') chatContainer: ElementRef<HTMLDivElement>;
    form: FormGroup = new FormGroup({
        message: new FormControl('')
    });
    isResponding: boolean = false;
    chats: ChatBubbleConfig[] =[];
    isLoadingChat: boolean = false;
    crrUser:any;
    private userSubscription: Subscription;
    private messageSubscription: Subscription;

    constructor(private chatService:ChatService, private userService: UserService) {
        
    }
    
    ngOnInit(): void {
        this.userSubscription = this.userService.user$.subscribe(user=>{
            this.crrUser = user;
        })

        this.chatService.connect();

        this.messageSubscription = this.chatService.messages$.subscribe(msg =>{
            console.log("CHECK MSG FROM BE: ",msg)
            console.log("CHECK USER: ",this.crrUser)
            if (this.crrUser){
                const message:ChatBubbleConfig = {
                    position:this.getMessagePosition(msg),
                    text:msg.text,
                    timestamp:msg.timestamp,
                    time:this.formatTimestamp(msg.timestamp)
                }
                this.chats.push(message);
            }
        })
    }
    ngOnDestroy(): void {
        this.userSubscription.unsubscribe();
        this.messageSubscription.unsubscribe();
    }

    getMessagePosition(msg: Message): 'left' | 'right' {
        if (this.crrUser.role === 2 || this.crrUser.role === 1) {  // Lễ tân hoặc Admin
            return msg.role === '3' ? 'left' : 'right'; // User bên trái, Admin/Lễ tân bên phải
        }
    
        if (this.crrUser.role === 3) {  // User
            return msg.role === '1' || msg.role === '2' ? 'left' : 'right'; // Admin/Lễ tân bên trái, User bên phải
        }
    
        return 'left'; // Default fallback
    }

    emitCloseChat() {
        this.closeChat.emit();
    }
    addMessage(){
        const messageControl = this.form.get('message');

        if (!messageControl) return; // chắc chắn form control tồn tại

        if (messageControl.invalid) {
            console.warn('Message is invalid!');
            messageControl.markAsTouched(); // đánh dấu đã touch để hiển thị error nếu có
            return;
        }

        const messageValue = messageControl.value;
        console.log('Sending message:', messageValue);
        const message :MessageSocket = {
            action: 'send_message',
            text:messageValue
        }
        
        this.chatService.sendMessage(message);

        // TODO: xử lý gửi message

        // Reset form sau khi gửi
        messageControl.reset();
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

    
}
