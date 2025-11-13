import { Component, Input } from '@angular/core';
import { UserChatConfig } from './user-card-chat.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-card-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card-chat.component.html',
  styles: ``
})
export class UserCardChatComponent {
  @Input() config!: UserChatConfig;
  @Input() user!: any;
}
