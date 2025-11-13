import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { LANG_STORAGE_KEY } from './language.constants';


@Injectable({
    providedIn: 'root',
})
export class LanguageService {
    constructor(private translocoService: TranslocoService) {}

    /**
     * Lấy ngôn ngữ hiện tại từ Transloco
     */
    get activeLang(): string {
        return this.translocoService.getActiveLang();
    }

    /**
     * Đặt ngôn ngữ, lưu vào localStorage
     */
    setActiveLang(lang: string): void {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
        this.translocoService.setActiveLang(lang);
    }

    /**
     * Khởi tạo ngôn ngữ từ localStorage (nếu có)
     */
    initLang(availableLangs: string[] | { id: string }[]): void {
        const storedLang = localStorage.getItem(LANG_STORAGE_KEY);

        if (!storedLang) return;

        const langs = Array.isArray(availableLangs)
            ? availableLangs.map((l: any) => typeof l === 'string' ? l : l.id)
            : [];

        if (langs.includes(storedLang)) {
            this.translocoService.setActiveLang(storedLang);
        }
    }
}
