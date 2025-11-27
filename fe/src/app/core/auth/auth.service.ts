import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/profile/user/user.service';
import {
    BehaviorSubject,
    catchError,
    finalize,
    map,
    Observable,
    of,
    shareReplay,
    switchMap,
    throwError,
} from 'rxjs';
import { uriConfig } from '../uri/config';
import { environment } from 'environments/environment';
import { News } from '../admin/news/news.types';
import { NewsCategory } from '../admin/news-category/news-category.types';
import { routeConfig } from '../uri/config.route';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _tokenChecked$?: Observable<boolean>;
    public _sendEmail: string = '';
    private _news: BehaviorSubject<News[]> = new BehaviorSubject<News[]>([]);
    public news$ = this._news.asObservable();
    private _newsCategories: BehaviorSubject<NewsCategory[]> =
        new BehaviorSubject<NewsCategory[]>([]);
    public newsCategories$ = this._newsCategories.asObservable();

    setSendEmail(email: string): void {
        this._sendEmail = email;
    }
    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    /**
     * Setter & getter for refresh token
     */
    set refreshToken(token: string) {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string {
        return localStorage.getItem('refreshToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * reset password
     *
     * @param email
     */
    restPassword(email: string): Observable<any> {
        return this._httpClient.post(uriConfig.API_USER_RESET_PASSWORD, {
            email: email,
        });
    }

    /**
     * change password
     *
     * @param password
     */
    changePassword(password: string): Observable<any> {
        return this._httpClient.post(uriConfig.API_USER_CHANGE_PASSWORD, {
            newPassword: password,
        });
    }

    /**
     * Reset password
     *
     * @param password
     */

    /**
     * get Token By RefreshToken
     *
     * @param credentials
     */
    getTokenByRefreshToken(): Observable<boolean> {
        if (!this.refreshToken) {
            return of(false);
        }

        return this._httpClient
            .post(uriConfig.API_USER_REFRESH_TOKEN, {
                refreshToken: this.refreshToken,
            })
            .pipe(
                map((response: any) => {
                    console.log('REFRESHTOKEN: ', response)
                    if (response?.data?.token.accessToken && response?.data?.token.refreshToken) {
                        this.accessToken = response.data.token.accessToken;
                        this.refreshToken = response.data.token.refreshToken;
                        return true;
                    }
                    return false;
                }),
                catchError(() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    this._authenticated = false;
                    return of(false);
                })
            );
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: {
        email?: string;
        username: string;
        password: string;
        rememberMe?: boolean;
    }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return this._httpClient
            .post(uriConfig.API_USER_LOGIN, credentials)
            .pipe(
                switchMap((response: any) => {
                    console.log("response o service: ", response)
                    // Store the access token in the local storage
                    // this.accessToken = response.accessToken;
                    this.accessToken = response.data.token.accessToken;

                    if (credentials.rememberMe)
                        this.refreshToken = response.data.token.refreshToken;

                    // Set the authenticated flag to true
                    this._authenticated = true;
                    console.log(this.refreshToken, this.accessToken)

                    // Store the user on the user service
                    this._userService.user = {...response.data.user, isFisrtLogin: response.data.isFisrtLogin};

                    // Return a new observable with the response
                    return of(response);
                })
            );
    }

    /**
     * Sign in using the access token
     */
    inforUsingToken(): Observable<boolean> {
        return this._httpClient.get(uriConfig.API_USER_INFOR).pipe(
            switchMap((response: any) => {
                this._authenticated = true;
                this._userService.user = response.data;
                return of(true);
            }),
            catchError(() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                this._authenticated = false;
                return of(false);
            })
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        return this._httpClient
            .post(uriConfig.API_USER_LOGOUT,null)
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap(() => {
                    // Remove the access token from the local storage

                    // Set the authenticated flag to false
                    this._authenticated = false;
                    // Remove the access token and refresh token from the local storage
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('session_id');
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('booking_id');
                    // Return a new observable with the response
                    return of(true);
                })
            );
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        fullName?: string;
        phone: string;
        password: string;
        email: string;
        username: string;
    }): Observable<any> {
        const data = {
            ...user,
        };
        return this._httpClient.post(uriConfig.API_USER_REGISTER, data);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Nếu không có access token → trả về false luôn

        if (!this.accessToken && !this.refreshToken) {
            console.log('No access token or refresh token found.');
            return of(false);
        }

        // Nếu token hết hạn → xóa token cũ, gọi refresh token
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            localStorage.removeItem('accessToken');

            if (this._tokenChecked$) {
                return this._tokenChecked$;
            }

            this._tokenChecked$ = this.getTokenByRefreshToken().pipe(
                switchMap((success) => {
                    if (!success) {
                        this._authenticated = false;
                        return of(false);
                    }
                    return this.inforUsingToken(); // Lấy thông tin user bằng token mới
                }),
                catchError(() => {
                    this._authenticated = false;
                    return of(false);
                }),
                finalize(() => {
                    this._tokenChecked$ = undefined;
                }),
                shareReplay(1)
            );

            return this._tokenChecked$;
        }

        // Token còn hạn và đã xác thực
        if (this._authenticated) {
            return of(true);
        }

        // Nếu chưa xác thực nhưng có token hợp lệ → lấy info user
        if (this._tokenChecked$) {
            return this._tokenChecked$;
        }

        this._tokenChecked$ = this.inforUsingToken().pipe(
            catchError(() => {
                this._authenticated = false;
                return of(false);
            }),
            finalize(() => {
                this._tokenChecked$ = undefined;
            }),
            shareReplay(1)
        );

        return this._tokenChecked$;
    }

    /**
     * exchangeCode from Keycloak for token
     */
    exchangeCodeForToken(code: string): Observable<any> {
        const codeVerifier = localStorage.getItem('pkce_code_verifier');

        const body = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('client_id', environment.keycloakClientId)
            .set('code', code)
            .set(
                'redirect_uri',
                `${window.location.origin}/${routeConfig.AUTH_CALLBACK}`
            )
            .set('code_verifier', codeVerifier || '');

        return this._httpClient.post(
            `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/token`,
            body.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
    }

    verifyAccessToken(accessToken: string): Observable<any> {
        return this._httpClient
            .post<{ data: any }>(uriConfig.API_VERIFY_KEYCLOAK, {
                accessToken: accessToken,
            })
            .pipe(
                map((response) => {
                    // Xử lý phản hồi từ API
                    return response?.data ?? null;
                }),
                catchError(() => of(null))
            );
    }

    getAllNews(payload: any): Observable<[News[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_NEWS, payload).pipe(
            switchMap((res) => {
                const totalNews = res?.data?.totalNews ?? 0;
                const news = res?.data?.news ?? [];
                this._news.next(news);
                return of<[News[], number]>([news, totalNews]);
            }),
            catchError(() => {
                this._news.next([]);
                return of<[News[], number]>([[], 0]);
            })
        );
    }

    getNewsByCategory(id: number, payload: any): Observable<[News[], number]> {
        return this._httpClient
            .post<any>(uriConfig.API_GET_NEWS_BY_CATEGORY, payload)
            .pipe(
                switchMap((res) => {
                    const totalNews = res?.data?.totalNews ?? 0;
                    const news = res?.data?.news ?? [];
                    this._news.next(news);
                    return of<[News[], number]>([news, totalNews]);
                }),
                catchError(() => {
                    this._news.next([]);
                    return of<[News[], number]>([[], 0]);
                })
            );
    }

    // getNewsById(id: number): Observable<News> {
    //     return this._httpClient.get<any>(`${uriConfig.API_GET_NEWS_DETAIL(id)}`).pipe(
    //         switchMap(res => of(res?.data))
    //     );
    // }

    getNewsCategories(payload: any): Observable<[NewsCategory[], number]> {
        return this._httpClient
            .post<any>(uriConfig.API_GET_NEWS_CATEGORY, payload)
            .pipe(
                switchMap((res) => {
                    const categories_parent =
                        res?.data?.newsCategoriesParent ?? [];
                    const totalNewsCategory = res?.data?.totalNewsCategory ?? 0;
                    this._newsCategories.next(categories_parent);
                    return of<[NewsCategory[], number]>([
                        categories_parent,
                        totalNewsCategory,
                    ]);
                }),
                catchError(() => {
                    this._newsCategories.next([]);
                    return of<[NewsCategory[], number]>([[], 0]);
                })
            );
    }
}
