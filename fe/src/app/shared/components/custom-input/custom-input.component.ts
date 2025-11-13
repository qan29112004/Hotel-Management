import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-custom-input',
    imports: [
        MatInputModule,
        ReactiveFormsModule,
        CommonModule,
        MatIconModule,
        MatButtonModule,
    ],
    standalone: true,
    templateUrl: './custom-input.component.html',
})
export class CustomInputComponent {
    @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

    @Input() label: string;
    @Input() placeholder: string;
    @Input() type = 'text';
    @Input() control!: FormControl;
    @Input() errorMessages: { [key: string]: string };
    @Input() required = false;
    @Input() inputClass = '';

    showPassword = false;

    get errorKeys(): string[] {
        return Object.keys(this.errorMessages || {});
    }
    get shouldShowErrors(): boolean {
        return this.control?.invalid;
    }
    focus(): void {
        this.inputElement?.nativeElement.focus();
    }
}
