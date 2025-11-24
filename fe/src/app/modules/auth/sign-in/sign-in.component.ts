import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation, inject, NgZone } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from 'app/core/auth/auth.service';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { Form, FormGroup, FormControl } from '@angular/forms';
import { routeConfig } from 'app/core/uri/config.route';
import { environment } from 'environments/environment';
import { filter, switchMap, take, tap } from 'rxjs';
import {
    generateCodeChallenge,
    generateRandomString,
} from 'app/core/keycloak/pkce.utils';
import { ChatService } from 'app/core/chat/chat.service';
import { UserService } from 'app/core/profile/user/user.service';
import { FuseSplashScreenService } from '@fuse/services/splash-screen';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from 'app/core/uri/config';
import { FuseAlertType, FuseAlertComponent } from '@fuse/components/alert';

declare const google: any;

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.Emulated,
    animations: fuseAnimations,
    standalone: true,
    styleUrls: ['./sign-in.component.css'],
    imports: [FormsModule, ReactiveFormsModule, CommonModule, SharedModule,FuseAlertComponent],
})
export class AuthSignInComponent implements OnInit {
    // @ViewChild('signInNgForm') signInNgForm: NgForm;
    // @ViewChild('emailInput') emailInput!: CustomInputComponent;

    // alert: { type: FuseAlertType; code: string; time?: string } = {
    //     type: 'success',
    //     code: '',
    // };
    // signInForm: UntypedFormGroup;
    // showAlert: boolean = false;
    isLoggingIn = false;
    /**
     * Constructor
     */
    alert: { type: FuseAlertType; code: string[] } = {
        type: 'success',
        code: [],
    };
    showAlert: boolean = false;
    private _chatService = inject(ChatService);
    private _userService = inject(UserService);
    progress: number = 0;
    form: FormGroup = new FormGroup({
            username: new FormControl(''),
            password: new FormControl(''),
        });

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _alertService: AlertService,
        private _translocoService: TranslocoService,
        private _authLayoutService: AuthLayoutService,
        private _fuseSplashScreenService: FuseSplashScreenService,
        private _httpClient: HttpClient,
        private ngZone: NgZone
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------
    ngAfterViewInit() {
        const clientId = '601097463713-msqb22gt741bck3n9fr0ci5mo8u4msne.apps.googleusercontent.com';

        google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => this.handleCredentialResponse(response)
        });

        google.accounts.id.renderButton(
        document.getElementById('googleButton'),
        { theme: 'outline', size: 'large' } // tuỳ chọn
        );

        // (tuỳ chọn) auto prompt
        // google.accounts.id.prompt();
    }
    /**
     * On init
     */
    ngOnInit(): void {
        this.showLoading();
        this.hideLoading();
        // this._activatedRoute.queryParams.pipe(take(1)).subscribe((params) => {
        //     if (!params['code']) {
        //         this.signIn();
        //     }
        // });
        // this._authLayoutService.setImage('assets/images/auth/sign-in.png');
        // this._authLayoutService.setTitle('Đăng nhập Portal');
        // this._authLayoutService.setTitleDes('');

        // this._activatedRoute.queryParams
        //     .pipe(
        //         take(1),
        //         filter((params) => !!params['code']),
        //         switchMap((params) => this._handleLoginWithCode(params['code']))
        //     )
        //     .subscribe({
        //         next: () => {
        //             const redirectURL =
        //                 this._activatedRoute.snapshot.queryParamMap.get(
        //                     'redirectURL'
        //                 ) || '/signed-in-redirect';

        //             this._userService.user$.subscribe((user) => {
                        
        //             });
        //             this._router.navigateByUrl(redirectURL).then(() => {
        //                 this.hideLoading(); // ✅ Di chuyển vào đây
        //             });
        //             this._alertService.showAlert({
        //                 title: this._translocoService.translate(
        //                     'other.success_title'
        //                 ),
        //                 message: this._translocoService.translate(
        //                     'sign_in.sign_in_success'
        //                 ),
        //                 type: 'success',
        //             });
        //         },
        //         error: (err) => {
        //             this.hideLoading();
        //             console.error('Đăng nhập thất bại:', err);
        //         },
        //     });
    }
    /**
     * Xử lý đăng nhập với mã xác thực (code)
     * @param code Mã xác thực nhận được từ Keycloak
     */
    private _handleLoginWithCode(code: string) {
        return this._authService.exchangeCodeForToken(code).pipe(
            switchMap((response) => {
                const accessToken = response.access_token;
                const keycloakLogoutToken = response.refresh_token;

                return this._authService.verifyAccessToken(accessToken).pipe(
                    tap((verifyResponse) => {
                        if (!verifyResponse?.token) {
                            throw new Error('Token verification failed');
                        }

                        localStorage.setItem(
                            'accessToken',
                            verifyResponse.token.accessToken
                        );
                        localStorage.setItem(
                            'refreshToken',
                            verifyResponse.token.refreshToken
                        );
                        localStorage.setItem(
                            'keycloakLogoutToken',
                            keycloakLogoutToken
                        );
                    })
                );
            })
        );
    }


    // ngAfterViewInit(): void {
    //     setTimeout(() => {
    //         this.emailInput.focus();
    //     });
    // }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn() {
        if(!this.form.valid)return
        const credentials = {
            username: this.form.get('username').value, // provide username
            password: this.form.get('password').value, // provide password
            // email: '', // optional
            rememberMe: true // optional
        };
        this._authService.signIn(credentials).subscribe({
            next:(response) => {
                // handle successful sign in
                // localStorage.setItem(
                //     'accessToken',
                //     response.data.token.accessToken
                // );
                // localStorage.setItem(
                //     'refreshToken',
                //     response.data.token.refreshToken
                // );
                console.log('Stored tokens:', {
                    accessToken: localStorage.getItem('accessToken'),
                    refreshToken: localStorage.getItem('refreshToken')
                });
                const redirectURL =
                this._activatedRoute.snapshot.queryParamMap.get(
                    'redirectURL'
                ) || '/signed-in-redirect';

                this._userService.user$.subscribe((user) => {
                    
                });
                this._router.navigateByUrl(redirectURL).then(() => {
                    this.hideLoading(); // ✅ Di chuyển vào đây
                });
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'other.success_title'
                    ),
                    message: this._translocoService.translate(
                        'sign_in.sign_in_success'
                    ),
                    type: 'success',
                });
            },
            error:(error) => {
                // handle error
                const errorList = error?.error?.errors;
                this.alert = {
                    type: 'error',
                    code: Array.isArray(errorList)
                        ? errorList.map(e => e.field ? `${e.field}: ${e.message}` : e.message)
                        : [error?.error?.message || error?.error?.code || 'Đã xảy ra lỗi'],
                };
                console.log("alert code: ", this.alert.code )
                this.showAlert = true;
                console.log("showalert", this.showAlert)
                this.form.enable();
                this.hideLoading();
                console.error('Đăng nhập thất bại:', error);
            }
        });
    }

    handleCredentialResponse(response: any) {
        const id_token = response.credential; // đây là ID token (JWT)
        // Gửi id_token lên backend để xác thực & nhận JWT của bạn
        this._httpClient.post(uriConfig.API_USER_AUTH_GOOGLE, { id_token }).subscribe({
        next: (res: any) => {
            // nhận access/refresh token từ backend
            localStorage.setItem('accessToken', res.data.token.accessToken);
            localStorage.setItem('refreshToken', res.data.token.refreshToken);
            const redirectURL =
                this._activatedRoute.snapshot.queryParamMap.get(
                    'redirectURL'
                ) || '/signed-in-redirect';

                this._userService.user$.subscribe((user) => {
                    
                });
                this._router.navigateByUrl(redirectURL).then(() => {
                    this.hideLoading(); // ✅ Di chuyển vào đây
                });
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'other.success_title'
                    ),
                    message: this._translocoService.translate(
                        'sign_in.sign_in_success'
                    ),
                    type: 'success',
                });
            // chuyển tiếp vào app
        },
        error: err => console.error(err)
        });
    }

    showLoading() {
        this._fuseSplashScreenService.show();
    }

    hideLoading() {
        this._fuseSplashScreenService.hide();
    }
}
