import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { fadeInOut } from 'app/shared/components/animations/fade.animation';
@Component({
  selector: 'app-detail-input',
  standalone: true,
  imports: [CommonModule, SharedModule],
  animations: [fadeInOut],
  templateUrl: './detail-input.component.html',
  styles: ``,
  encapsulation: ViewEncapsulation.None

})
export class DetailInputComponent {
  @Input() data: any;
  @Output() close = new EventEmitter<void>();
  showDetail = true;
  isClosing = false;
  sourceName: string = '';

  onClose(): void {
    this.isClosing = true;
    this.showDetail = false; // trigger :leave animation
  }

  onAnimationDone(event: AnimationEvent): void {
    const toState = (event as any).toState;
    if (this.isClosing && toState === 'void') {
      this.close.emit();
      this.isClosing = false;
    }
  }

  // Viết hoa ký tự đầu tiên của chuỗi
  capitalizeFirst(str: string, flag: boolean): string {
    if (flag) {
      str = this.data.config?.related_model.split('.')[0];
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}