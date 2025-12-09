import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ChatService } from 'app/core/chat/chat.service';
import { Observable, of, timer } from 'rxjs';
import { switchMap, take, timeout, catchError } from 'rxjs/operators';

/**
 * Socket Connection Resolver
 * Đảm bảo WebSocket connection được thiết lập trước khi render component
 * Sử dụng cho các route cần socket connection (như DenseLayoutComponent)
 */
export const socketConnectionResolver: ResolveFn<boolean> = (route, state): Observable<boolean> => {
    const chatService = inject(ChatService);
    // 
    console.log('[SocketResolver] Ensuring socket connection before rendering component...');

    return chatService.connect().pipe(
        // 1) Đợi cho đến khi trạng thái là "connected = true"
        switchMap(isConnected => {
            if (isConnected) {
                console.log('[SocketResolver] Connected! Waiting for first message...');
                // 2) Đợi message đầu tiên gửi từ server
                return chatService.messages$.pipe(take(1));
            }
            return of(null);
        }),
        timeout(10000), // tránh treo nếu server không trả lời
        catchError(err => {
            console.error('[SocketResolver] Failed or timeout:', err);
            return of(null); // vẫn cho vào trang
        })
    );
};
