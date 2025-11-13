import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Status, User, Role  } from 'app/core/profile/user/user.types';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    BehaviorSubject,
    switchMap,
    tap,
} from 'rxjs';
import { uriConfig } from '../../uri/config';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    public itemUser$ = this._user.asObservable();
    public mediaUrl = environment.mediaUrl;
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<any> {
        // console.log('[UserService] get() called');
        return this._httpClient.get(uriConfig.API_USER_INFOR).pipe(
            map((response: any) => {
                if (response?.data?.user) {
                    const user = {
                        ...response.data.user,
                    };
                    console.log("next user")
                    this._user.next(user);

                    return user;
                }
                return null;
            }),
            catchError(() => of(null))
        );
    }

    /**
     * Get all user
     */
    getAllUser(payload?: any): Observable<any> {
        return this._httpClient.post(uriConfig.API_ALL_USERS, payload ?? {}).pipe(
          map((response: any) => response?.data ?? null),
          catchError(() => of(null))
        );
    }


    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._httpClient
            .put<User>(uriConfig.API_USER_INFOR_UPDATE, user)
            .pipe(
                map((response) => {
                    this._user.next(response);
                })
            );
    }

    /**
     * getStatus of user
     */
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
            {
                id: 3,
                name: 'pending',
                class: 'bg-amber-100 text-amber-700',
                is_list: true,
            },
        ];
    }

    getRole(): Role[] {
        return [
            {
                id: 1,
                name: 'admin',
                class: 'bg-emerald-100 text-emerald-700',
                is_list: false,
            },
            {
                id: 2,
                name: 'mod',
                class: 'bg-red-100 text-red-700',
                is_list: false,
            },
            {
                id: 3,
                name: 'user',
                class: 'bg-amber-100 text-amber-700',
                is_list: true,
            },
        ];
    }

    /**
     * Update user information using the access token
     */
    getUsernameById(id: number): Observable<string> {
        return this._httpClient
            .get<any>(`${uriConfig.API_USER_BY_ID(id)}`)
            .pipe(map((response: any) => response?.data?.username ?? ''));
    }

    uploadAvatar(url: string): Observable<any> {
        return this._httpClient
            .post<any>(uriConfig.API_UPLOAD_AVATAR, { url })
            .pipe(
                tap((response) => {
                    if (response?.data?.user) {
                        this.user = response.data.user;
                    }
                }),
                catchError((error) => {
                    console.error('Error uploading avatar:', error);
                    return of(null);
                })
            );
    }

    uploadImage(payload: any): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_UPLOAD_IMAGE, payload).pipe(
            map((response: any) => {
                // Nếu response trả về là relative path, thêm domain
                if (response.data?.url && !response.data.url.startsWith('http')) {
                    response.data.url = `${this.mediaUrl}${response.data.url}`;
                }
                return response;
            })
            // switchMap(res => of(res))
        );
    }
}
