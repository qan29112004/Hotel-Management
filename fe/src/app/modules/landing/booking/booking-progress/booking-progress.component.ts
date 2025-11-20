import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';


@Component({
  standalone:true,
  imports: [CommonModule, SharedModule],
  selector: 'app-booking-progress',
  templateUrl: './booking-progress.component.html',
})
export class BookingProgressComponent implements OnChanges {
  @Input() currentStep!: 'rate' | 'service' | 'info';
  @Input() currentRoom!: number;
  @Input() totalRooms!: number;
  @Output() step = new EventEmitter<string>();
  steps = ['Rate', 'Service', 'Customer Info'];
  stepIndex = 0;
  progressWidth = 0;
  // map currentStep → index
  stepToIndex: Record<'rate' | 'service' | 'info', number> = {
    rate: 0,
    service: 1,
    info: 2,
  };

  // map index → currentStep
  indexToStep: Record<number, 'rate' | 'service' | 'info'> = {
    0: 'rate',
    1: 'service',
    2: 'info',
  };

  ngOnChanges() {
    this.stepIndex = this.stepToIndex[this.currentStep];
    this.progressWidth = (this.stepIndex / (this.steps.length - 1)) * 100;
  }
  // Hàm xử lý chuyển bước
  onStepClick(index: number) {
    if (index <= this.stepIndex) {  // Nếu bước trước hoặc bước hiện tại
      this.stepIndex = index;
      this.step.emit(this.indexToStep[index])  // Chuyển đến bước được click
      // Truyền lại giá trị step qua Output hoặc dùng điều hướng tùy yêu cầu
    }
  }
}
