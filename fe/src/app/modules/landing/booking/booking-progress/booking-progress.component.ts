import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
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

  steps = ['Rate', 'Service', 'Customer Info'];
  stepIndex = 0;
  progressWidth = 0;

  ngOnChanges() {
    const indexMap: Record<'rate' | 'service' | 'info', number> = {
      rate: 0,
      service: 1,
      info: 2,
    };
    this.stepIndex = indexMap[this.currentStep];
    this.progressWidth = (this.stepIndex / (this.steps.length - 1)) * 100;
  }
}
