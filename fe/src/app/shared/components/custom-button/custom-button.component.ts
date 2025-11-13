import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-custom-button',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        NgIf,
        MatProgressSpinnerModule,
        RouterLink,
    ],
    templateUrl: './custom-button.component.html',
    styles: `
    :host {
        display: block; // Đảm bảo host element chiếm full width
        width: 100%;

        button {
            width: 100%; // Dự phòng nếu Tailwind không load
            min-width: unset !important; // Fix min-width mặc định của Material

            // Fix padding cho dense mode
            &.dense {
            padding: 0 8px;
            line-height: 36px;
            }

            // Fix border cho stroked button
            &.mat-mdc-stroked-button {
            border-width: 1px;
            }
        }
    }
    `,
})
export class CustomButtonComponent {
    @Input() type: 'button' | 'submit' | 'reset' = 'button';
    @Input() variant: 'flat' | 'stroked' | 'raised' = 'flat';
    @Input() color: string = 'primary';
    @Input() loading: boolean = false;
    @Input() disabled: boolean = false;
    @Input() routerLink: string | any[] = '';
    @Input() label: string = '';
    @Input() dense: boolean = false;
    @Input() customClass: string = '';

    @Output() clicked = new EventEmitter<void>();

    onClick() {
        if (!this.loading && !this.disabled) {
            this.clicked.emit();
        }
    }
    getClassList(): string {
        return `w-full ${this.dense ? 'dense' : ''} ${
            this.customClass || ''
        }`.trim();
    }
}
