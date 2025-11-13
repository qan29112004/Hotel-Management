import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-chat.component.html',
  styles: ``
})
export class DeleteChatComponent {
  @Output() close = new EventEmitter();
  @Output() submit = new EventEmitter();

  cancelModal():void{
    this.close.emit();
  }
  submitModal():void{
    this.submit.emit();
  }
}
