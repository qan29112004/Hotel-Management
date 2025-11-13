import {
    Component,
    OnInit,
    OnDestroy,
    AfterViewInit,
    Output,
    EventEmitter,
    HostListener,
    Input,
    ViewChild,
    ElementRef,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-audio-wave',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            class="flex items-center space-x-3 w-full mx-auto"
            [class]="containerClass"
        >
            <!-- Cancel Button -->
            <button
                (click)="onCancel()"
                class="flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none"
                [class]="cancelButtonClass"
                [style.background-color]="'#3941AB'"
            >
                <svg
                    [class]="cancelIconClass"
                    class="text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            <!-- Audio Player Container -->
            <div
                class="flex items-center rounded-full shadow-sm flex-1 overflow-hidden"
                [class]="playerContainerClass"
                [style.background-color]="'#E0EAFF'"
            >
                <!-- Send Button -->
                <button
                    (click)="onSend()"
                    class="flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none"
                    [class]="sendButtonClass"
                    [style.background-color]="'#3941AB'"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        [class]="sendIconClass"
                        class="text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>

                <!-- Wave Animation -->
                <div
                    #waveContainer
                    class="flex items-end flex-1 px-2 overflow-hidden"
                    [class]="waveContainerClass"
                >
                    <div
                        *ngFor="let bar of waveBars; let i = index"
                        class="rounded-full transition-all duration-150"
                        [style.width.px]="barWidth"
                        [style.marginRight.px]="barGap"
                        [style.height]="barHeights[i] + 'px'"
                        [style.background-color]="'#3941AB'"
                    ></div>
                </div>

                <!-- Time Display -->
                <div
                    class="text-white font-medium rounded-full"
                    [class]="timeDisplayClass"
                    [style.background-color]="'#3941AB'"
                >
                    {{ currentTime }}
                </div>
            </div>
        </div>
    `,
})
export class AudioWaveComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() mode: 'fullscreen' | 'widget' = 'fullscreen';
    @Output() cancel = new EventEmitter<void>();
    @Output() send = new EventEmitter<void>();
    @Input() isRecording = false;
    @Input() isProcessing = false;
    @ViewChild('waveContainer', { static: false }) waveContainer!: ElementRef;

    isPlaying = true;
    currentTime = '0:00';

    barWidth = 3;
    barGap = 2;
    waveBars: number[] = [];
    barHeights: number[] = [];

    private timeInterval?: any;
    private animationInterval?: any;
    private currentSeconds = 0;

    // Dynamic classes based on mode
    get containerClass(): string {
        return this.mode === 'widget' ? 'max-w-sm' : '';
    }

    get cancelButtonClass(): string {
        return this.mode === 'widget' ? 'w-8 h-8' : 'w-10 h-10';
    }

    get cancelIconClass(): string {
        return this.mode === 'widget' ? 'w-5 h-5' : 'w-7 h-7';
    }

    get playerContainerClass(): string {
        return this.mode === 'widget' ? 'px-2 py-2' : 'px-4 py-3';
    }

    get sendButtonClass(): string {
        return this.mode === 'widget' ? 'w-7 h-7 mr-2' : 'w-10 h-10 mr-4';
    }

    get sendIconClass(): string {
        return this.mode === 'widget' ? 'w-4 h-4' : 'w-6 h-6';
    }

    get waveContainerClass(): string {
        return this.mode === 'widget' ? 'h-6' : 'h-10';
    }

    get timeDisplayClass(): string {
        return this.mode === 'widget'
            ? 'text-sm px-3 py-1 ml-2'
            : 'text-xl px-6 py-2 ml-4';
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isRecording']) {
            if (this.isRecording) {
                this.setupTimers();
            }
        }
    }

    ngAfterViewInit() {
        setTimeout(() => this.calculateBars(), 0);
    }

    ngOnDestroy() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.animationInterval) clearInterval(this.animationInterval);
    }

    @HostListener('window:resize')
    onResize() {
        this.calculateBars();
    }

    onCancel() {
        this.cancel.emit();
    }

    onSend() {
        this.send.emit();
    }

    private setupTimers() {
        this.timeInterval = setInterval(() => {
            if (this.isPlaying) {
                this.currentSeconds++;
                this.updateTimeDisplay();
            }
        }, 1000);

        this.animationInterval = setInterval(() => {
            if (this.isPlaying) {
                const maxHeight = this.mode === 'widget' ? 20 : 36;
                const minHeight = this.mode === 'widget' ? 2 : 4;
                this.barHeights = this.waveBars.map(
                    () => Math.floor(Math.random() * maxHeight) + minHeight
                );
            } else {
                const staticHeight = this.mode === 'widget' ? 2 : 4;
                this.barHeights = this.waveBars.map(() => staticHeight);
            }
        }, 120);
    }

    private calculateBars() {
        if (!this.waveContainer?.nativeElement) return;

        const containerWidth = this.waveContainer.nativeElement.offsetWidth;

        if (containerWidth === 0) {
            setTimeout(() => this.calculateBars(), 100);
            return;
        }

        this.barWidth = this.mode === 'widget' ? 2 : 3;
        this.barGap = this.mode === 'widget' ? 1 : 2;

        const totalBarSpace = this.barWidth + this.barGap;
        const availableWidth =
            containerWidth - (this.mode === 'widget' ? 8 : 16);
        const barCount = Math.floor(availableWidth / totalBarSpace);

        const minBars = this.mode === 'widget' ? 8 : 15;
        const finalBarCount = Math.max(barCount, minBars);

        this.waveBars = Array.from({ length: finalBarCount }, (_, i) => i);
        const staticHeight = this.mode === 'widget' ? 2 : 4;
        this.barHeights = this.waveBars.map(() => staticHeight);
    }

    private updateTimeDisplay() {
        const minutes = Math.floor(this.currentSeconds / 60);
        const seconds = this.currentSeconds % 60;
        this.currentTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
