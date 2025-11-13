import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatBubbleConfig } from './chat-bubble.types';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { SharedModule } from 'app/shared/shared.module';
import { AudioPlayerComponent } from './audio/audio-player.component';

@Component({
    selector: 'app-chat-bubble',
    standalone: true,
    imports: [
        CommonModule,
        MarkdownComponent,
        SharedModule,
        AudioPlayerComponent,
    ],
    templateUrl: './chat-bubble.component.html',
    styles: ``,
})
export class ChatBubbleComponent {
    @Input() config!: any;
    @Input() user!: any;
    @Input() inforUser!: any;
    @Input() inforAdmin!: any;
    @Output() loadImage = new EventEmitter();
}
