import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
@Component({
  selector: 'app-detail-amenity',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './detail-amenity.component.html',
  styles: ``
})
export class DetailAmenityComponent {
  @Input() roomtype:any;
  @Output() closePopup = new EventEmitter<any>();
  closePopupFunc(){
    this.closePopup.emit(true);
  }
}
