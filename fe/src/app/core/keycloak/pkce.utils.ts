import { SHA256 } from 'crypto-js';
import Base64 from 'crypto-js/enc-base64';

export function generateRandomString(length: number): string {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);

    // ✅ LUÔN gọi rõ từ window.crypto để tránh override
    window.crypto.getRandomValues(array);
    array.forEach((c) => (result += charset[c % charset.length]));
    return result;
}

export async function generateCodeChallenge(
    codeVerifier: string
): Promise<string> {
    // Nếu trình duyệt hỗ trợ subtle.crypto.digest
    if (typeof window !== 'undefined' && window.crypto?.subtle?.digest) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Fallback: Dùng crypto-js nếu không hỗ trợ subtle API
    const hash = SHA256(codeVerifier);
    const base64 = Base64.stringify(hash);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
