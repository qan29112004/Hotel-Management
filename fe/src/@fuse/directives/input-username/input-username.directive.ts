import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[appUsernameSanitize]',
    exportAs  : 'appUsernameSanitize',
    standalone: true
})
export class UsernameSanitizeDirective {
    constructor(private control: NgControl) {}

    @HostListener('input', ['$event'])
    onInput(event: Event): void {
        const input = (event.target as HTMLInputElement).value;

        // Normalize về không dấu + thường + lọc ký tự
        const sanitized = this.sanitizeUsername(input);
        this.control.control?.setValue(sanitized, { emitEvent: false });
    }

    private sanitizeUsername(value: string): string {
        return value
            .toLowerCase()
            .normalize('NFD')                           // Tách dấu tiếng Việt
            .replace(/[\u0300-\u036f]/g, '')           // Xóa dấu
            .replace(/[^a-z0-9@_-]/g, '');             // Chỉ cho phép ký tự hợp lệ
    }
}
