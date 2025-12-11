import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ChatService } from 'app/core/chat/chat.service';
import { Observable, of, timer } from 'rxjs';
import { switchMap, take, timeout, catchError, filter } from 'rxjs/operators';
import { FuseSplashScreenService } from '@fuse/services/splash-screen';

/**
 * Socket Connection Resolver
 * Đảm bảo WebSocket connection được thiết lập trước khi render component
 * Sử dụng cho các route cần socket connection (như DenseLayoutComponent)
 */
export const socketConnectionResolver: ResolveFn<boolean> = (route, state): Observable<boolean> => {
    const chatService = inject(ChatService);
    const splashScreen = inject(FuseSplashScreenService);
    // 
    // splashScreen.show()
    console.log('[SocketResolver] Ensuring socket connection before rendering component...');

    return chatService.connect().pipe(
        // 1) Đợi cho đến khi trạng thái là "connected = true"
        filter(isConnected => !!isConnected),
        take(1),
        // Bỏ switchMap đợi message để tránh timeout nếu server không gửi gì ngay
        timeout(10000), // tránh treo nếu server không trả lời
        catchError(err => {
            console.error('[SocketResolver] Failed or timeout:', err);
            return of(true); // vẫn cho vào trang
        })
    );
};
