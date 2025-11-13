import { Injectable } from '@angular/core';
import { uriConfig } from '../uri/config';

@Injectable({
    providedIn: 'root',
})
export class TtsService {
    private cache = new Map<string, string>(); // text -> objectURL

    constructor() {}

    async streamTts(
        text: string,
        onFirstChunk?: () => void
    ): Promise<HTMLAudioElement> {
        // 1️⃣ Nếu đã cache → trả audio ngay
        if (this.cache.has(text)) {
            const cachedUrl = this.cache.get(text)!;
            const audio = new Audio(cachedUrl);
            if (onFirstChunk) setTimeout(() => onFirstChunk(), 0);
            return audio;
        }

        // 2️⃣ Nếu chưa cache → tạo MediaSource để stream
        const mediaSource = new MediaSource();
        const mediaSourceUrl = URL.createObjectURL(mediaSource);
        const audio = new Audio(mediaSourceUrl);

        return new Promise<HTMLAudioElement>((resolve, reject) => {
            mediaSource.addEventListener('sourceopen', () => {
                const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
                resolve(audio);
                this.fetchStreamRealtime(
                    text,
                    sourceBuffer,
                    mediaSource,
                    audio,
                    onFirstChunk,
                    (blobUrl) => {
                        this.cache.set(text, blobUrl);
                    }
                ).catch(reject);
            });
        });
    }

    private async fetchStreamRealtime(
        text: string,
        sourceBuffer: SourceBuffer,
        mediaSource: MediaSource,
        audio: HTMLAudioElement,
        onFirstChunk: (() => void) | undefined,
        onComplete: (blobUrl: string) => void
    ) {
        try {
            const response = await fetch(uriConfig.API_CHATBOT_AUDIO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok)
                throw new Error(`TTS server error: ${response.status}`);
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Không thể đọc stream từ server');

            const chunks: BlobPart[] = [];
            const pendingBuffers: ArrayBuffer[] = [];

            let isFirstChunk = true;
            let hasStartedPlaying = false;
            let playRequested = false; // 🔑 kiểm soát play chỉ 1 lần

            const appendNextBuffer = () => {
                if (pendingBuffers.length > 0 && !sourceBuffer.updating) {
                    const next = pendingBuffers.shift()!;
                    sourceBuffer.appendBuffer(next);
                }
            };

            sourceBuffer.addEventListener('updateend', () => {
                appendNextBuffer();

                // 🔑 Play audio chỉ 1 lần
                if (
                    !hasStartedPlaying &&
                    audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
                ) {
                    if (!playRequested) {
                        playRequested = true;
                        audio
                            .play()
                            .then(() => {
                                hasStartedPlaying = true;
                                playRequested = false;
                            })
                            .catch(console.error);
                    }
                }
            });

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Chờ hết queue
                    await new Promise<void>((resolve) => {
                        if (
                            pendingBuffers.length === 0 &&
                            !sourceBuffer.updating
                        ) {
                            resolve();
                        } else {
                            const check = () => {
                                if (
                                    pendingBuffers.length === 0 &&
                                    !sourceBuffer.updating
                                ) {
                                    sourceBuffer.removeEventListener(
                                        'updateend',
                                        check
                                    );
                                    resolve();
                                }
                            };
                            sourceBuffer.addEventListener('updateend', check);
                        }
                    });

                    if (mediaSource.readyState === 'open')
                        mediaSource.endOfStream();
                    const blob = new Blob(chunks, { type: 'audio/mpeg' });
                    const blobUrl = URL.createObjectURL(blob);
                    onComplete(blobUrl);
                    break;
                }

                if (value) {
                    chunks.push(value);
                    pendingBuffers.push(value.buffer);

                    // Callback chunk đầu tiên
                    if (isFirstChunk && onFirstChunk) {
                        isFirstChunk = false;
                        onFirstChunk();
                    }

                    appendNextBuffer();
                }
            }
        } catch (err) {
            throw err;
        }
    }
}
