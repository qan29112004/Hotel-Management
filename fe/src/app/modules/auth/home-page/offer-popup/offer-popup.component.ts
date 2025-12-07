import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from 'environments/environment.fullstack';
@Component({
    selector: 'app-offer-popup',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './offer-popup.component.html',
    styleUrls: ['./offer-popup.component.scss']
})
export class OfferPopupComponent {
    baseUrl:string = environment.baseUrl;
    @Input() offer: any;
    @Input() image: string = '';
    @Output() close = new EventEmitter<void>();

    onClose() {
        this.close.emit();
    }

    // Prevent click on content from closing the modal
    onContentClick(event: MouseEvent) {
        event.stopPropagation();
    }
}
