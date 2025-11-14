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
import { Message } from 'app/core/chat/chat.types';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@ngneat/transloco';
import { compareDates } from 'app/shared/utils/chat/compare_time.util';
import { formatTimestamp } from 'app/shared/utils/chat/format_time.util';


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
export class ChatWidgetComponent implements OnInit
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
        message: new FormControl(''),
        file: new FormControl(null),
    });
    isResponding: boolean = false;
    chats: any[];
    isLoadingChat: boolean = false;
    
    ngOnInit(): void {
        console.log("init chatwidget")
    }

    emitCloseChat() {
        this.closeChat.emit();
    }
    addMessage(){}

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
