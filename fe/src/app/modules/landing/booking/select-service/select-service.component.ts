import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

@Component({
  selector: 'app-select-service',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './select-service.component.html',
  styles: ``,
  template: `
    <h2 class="text-lg font-semibold mb-4">Select Services for Room {{ roomIndex + 1 }}</h2>
    <button
      class="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800"
      (click)="completeService()">
      Confirm Services
    </button>
  `
})
export class SelectServiceComponent {
  @Input() roomIndex!: number;
  @Output() servicesSelected = new EventEmitter<number[]>();

  completeService() {
    this.servicesSelected.emit([101, 102]); // demo id services
  }
}
