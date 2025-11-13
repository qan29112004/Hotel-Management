import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    let newReq = req;

    const token = authService.accessToken;

    if (token) {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + token),
        });
    }

    return next(newReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && authService.refreshToken) {
                // Thử refresh token

                return from(authService.getTokenByRefreshToken()).pipe(
                    switchMap((success) => {
                        if (!success) {
                            authService.signOut();
                            location.reload();
                            return throwError(() => error);
                        }

                        // Retry request với token mới
                        const newAccessToken = authService.accessToken;
                        const retryReq = req.clone({
                            headers: req.headers.set(
                                'Authorization',
                                'Bearer ' + newAccessToken
                            ),
                        });

                        return next(retryReq);
                    }),
                    catchError((err) => {
                        authService.signOut();
                        location.reload();
                        return throwError(() => err);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};
