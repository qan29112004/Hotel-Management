import { Component, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { TtsService } from 'app/core/chat/audio.service';

import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    imports: [SharedModule],
    standalone: true,
})
export class AudioPlayerComponent implements OnDestroy {
    @Input() text!: string;

    audio!: HTMLAudioElement;
    cachedUrl: string | null = null;
    isPlaying = false;
    isFinished = false;
    isStarted = false;
    isLoading = false;

    // ✅ Internal state để track chính xác
    private isProcessing = false;
    private hasAudioInstance = false;
    private abortController: AbortController | null = null;

    constructor(
        private ttsService: TtsService,
        private _alertService: AlertService,
        private _translocoService: TranslocoService,
        private cdr: ChangeDetectorRef
    ) {}

    async toggleAudio() {
        // ✅ KIỂM TRA this.audio TỒN TẠI trước khi gọi pause
        if (this.isPlaying && this.audio) {
            this.audio.pause();
            this.isPlaying = false;
            this.cdr.detectChanges();
            return;
        }

        // ✅ Nếu đang loading thì không làm gì
        if (this.isLoading) {
            return;
        }

        // ✅ Nếu audio đã tồn tại nhưng đã pause/finished
        if (this.audio && !this.isPlaying) {
            this.playAudio();
            return;
        }

        // ✅ Tạo audio lần đầu
        if (!this.audio && this.text) {
            try {
                const plainText = this.text;

                // Set loading state
                this.isLoading = true;
                this.isStarted = true;
                this.cdr.detectChanges();

                // ✅ Gán audio trước khi callback
                this.audio = await this.ttsService.streamTts(plainText, () => {
                    this.isLoading = false;
                    this.isPlaying = true;
                    this.cdr.detectChanges();
                });

                this.cachedUrl = this.audio.src;

                // Setup event listeners
                this.audio.onended = () => {
                    this.isPlaying = false;
                    this.isFinished = true;
                    this.cdr.detectChanges();
                };

                this.audio.onpause = () => {
                    this.isPlaying = false;
                    this.cdr.detectChanges();
                };

                this.audio.onplay = () => {
                    this.isPlaying = true;
                    this.isFinished = false; // ✅ Reset isFinished khi bắt đầu play
                    this.cdr.detectChanges();
                };
            } catch (error) {
                this._alertService.showAlert({
                    type: 'error',
                    message: this._translocoService.translate(error),
                    title: this._translocoService.translate(
                        'other.error_title'
                    ),
                });

                // Reset states on error
                this.isLoading = false;
                this.isPlaying = false;
                this.isStarted = false;
                this.cdr.detectChanges();
            }
        }
    }

    private playAudio() {
        if (!this.audio) return; // ✅ Safety check

        // ✅ CHỈ reset về đầu khi audio đã kết thúc hoàn toàn
        if (this.isFinished) {
            this.audio.currentTime = 0;
            this.isFinished = false;
        }

        // ✅ Play từ vị trí hiện tại (không reset currentTime)
        if (this.audio.paused) {
            this.audio.play().catch((error) => {
                this.isPlaying = false;
                this.cdr.detectChanges();
            });
        }

        this.isPlaying = true;
        this.isStarted = true;
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        // ✅ Cancel any pending requests
        if (this.abortController) {
            this.abortController.abort();
        }

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
        if (this.cachedUrl) {
            URL.revokeObjectURL(this.cachedUrl);
        }
    }

    private resetStates() {
        this.isLoading = false;
        this.isPlaying = false;
        this.isStarted = false;
        this.isProcessing = false;
        this.cdr.detectChanges();
    }

    // private async markdownToText(md: string): Promise<string> {
    //     if (!md) return '';
    //     const html = await marked.parse(md);
    //     const parser = new DOMParser();
    //     const doc = parser.parseFromString(html, 'text/html');
    //     return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
    // }
}
