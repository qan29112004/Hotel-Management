import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
    registerLocaleData,
    formatDate as angularFormatDate,
} from '@angular/common';
import localeVi from '@angular/common/locales/vi';
import { MAT_DATE_LOCALE } from '@angular/material/core';

registerLocaleData(localeVi);

@Component({
    selector: 'app-custom-datepicker',
    standalone: true,
    imports: [
        CommonModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        ReactiveFormsModule,
    ],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'vi-VN' }],
    templateUrl: './custom-datepicker.component.html',
})
export class CustomDatepickerComponent implements OnInit {
    @Input() label: string = 'Khoảng ngày';
    @Input() selectedOptions: any[] = [];
    @Output() selectedOptionsChange = new EventEmitter<string[]>(); // emit [startDateStr, endDateStr]

    startControl = new FormControl();
    endControl = new FormControl();

    startDisplay = '';
    endDisplay = '';
    minEndDate: Date | null = null;

    ngOnInit(): void {
        this.startControl.valueChanges.subscribe((start: Date | null) => {
            const dateObj = new Date(start);
            const convertedDate = new Date(
                dateObj.getFullYear(),
                dateObj.getMonth(), // Tháng trong JS bắt đầu từ 0
                dateObj.getDate()
            );
            this.minEndDate = convertedDate;
            this.updateAndEmitRange();
        });

        this.endControl.valueChanges.subscribe((end) => {
            this.updateAndEmitRange();
        });
    }

    private updateAndEmitRange() {
        const start: Date | null = this.startControl.value;
        const end: Date | null = this.endControl.value;

        this.startDisplay = start ? this.formatDisplayDate(start) : '';
        this.endDisplay = end ? this.formatDisplayDate(end) : '';
        if (start && end) {
            const result = [
                this.formatFullDate(start),
                this.formatFullDate(end),
            ];
            this.selectedOptionsChange.emit(result);
        } else {
            this.selectedOptionsChange.emit([]);
        }
    }

    private formatFullDate(date: any): string {
        if (date && typeof date.toISO === 'function') {
            const iso = date.toISO(); // "2025-05-21T03:39:54.000+07:00"
            const formatted = iso.replace('T', ' ').replace(/(\+.*|Z)/, '');
            const parts = formatted.split('.');
            return parts[0] + '.' + (parts[1] ?? '000000');
        }

        // fallback nếu không phải Luxon
        if (date && date instanceof Date && !isNaN(date.getTime())) {
            const iso = date.toISOString();
            const formatted = iso.replace('T', ' ').replace('Z', '');
            const parts = formatted.split('.');
            return parts[0] + '.' + (parts[1] ?? '000000');
        }

        return '';
    }

    private formatDisplayDate(date: Date): string {
        return angularFormatDate(date, 'dd/MM/yyyy', 'vi-VN');
    }
}
