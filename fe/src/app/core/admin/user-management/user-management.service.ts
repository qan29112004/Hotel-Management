import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { Status, User, UserResponse, Role } from './user-management.types';
import LoginHistory from './login-history.type';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
    private _httpClient = inject(HttpClient);

    private _users: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    public users$ = this._users.asObservable();
    private _itemUser = new BehaviorSubject<any>(null);
    itemUser$ = this._itemUser.asObservable(); // Cho component khác subscribe

    setItemUser(user: any): void {
        this._itemUser.next(user);
    }

    clearItemUser(): void {
        this._itemUser.next(null);
    }
    /**
     * create the user
     *
     * @param user
     */
    create(user: User): Observable<any> {
        return this._httpClient.post(uriConfig.API_CREATE_USER, user).pipe(
            // catchError(() => of(false)),
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    update(user: User): Observable<any> {
        return this._httpClient
            .put(`${uriConfig.API_UPDATE_USER}${user.id}/`, user)
            .pipe(
                switchMap((response: any) => {
                    return of(response);
                })
            );
    }
    getUsers(payload: any): Observable<UserResponse> {
        return this._httpClient
            .post<UserResponse>(uriConfig.API_GET_USER, payload)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: UserResponse) => {
                    if (response && response.data.users) {
                        this._users.next(response.data.users); // cập nhật vào bộ nhớ
                    }
                    return of(response);
                })
            );
    }

    getStatus(): Status[] {
        return [
            {
                id: 1,
                name: 'active',
                class: 'bg-emerald-100 text-emerald-700',
                is_list: false,
            },
            {
                id: 2,
                name: 'inactive',
                class: 'bg-red-100 text-red-700',
                is_list: false,
            },
        ];
    }

    getRole(): Role[] {
        return [
            {
                id: 1,
                name: 'admin',
                class: 'text-emerald-500',
                is_list: false,
            },
            {
                id: 2,
                name: 'receptionist',
                class: 'text-amber-500',
                is_list: false,
            },
            {
                id: 3,
                name: 'user',
                class: 'text-blue-500',
                is_list: true,
            },
        ];
    }

    resendUserEmail(ids: any): Observable<any> {
        return this._httpClient
            .post<any>(uriConfig.API_RESEND_USER_EMAIL, ids)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: any) => {
                    return of(response);
                })
            );
    }

    deleteUser(id: number): Observable<User> {
        console.log('deleteUser nhận id:', id, 'type:', typeof id);
        return this._httpClient.delete<any>(`${uriConfig.API_DELETE_USER}${id}/`).pipe(
                switchMap(res => of(res?.data?.user))
            );
    }
    

    getLoginHistory(
        user: User,
        offset = 0,
        limit = 10
    ): Observable<{ result: LoginHistory[]; total: number }> {
        return this._httpClient
            .get<any>(`${uriConfig.API_GET_LOGIN_HISTORY}${user.id}`, {
                params: {
                    offset: offset.toString(),
                    limit: limit.toString(),
                },
            })
            .pipe(
                catchError(() => of({ result: [], total: 0 })),
                switchMap((response) => of(response.data))
            );
    }
}
