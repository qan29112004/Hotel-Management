import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { AuthService } from 'app/core/auth/auth.service';
import { routeConfig } from 'app/core/uri/config.route';
import { SharedModule } from 'app/shared/shared.module';

@Component({
    selector: 'auth-confirmation-email',
    templateUrl: './confirmation-email.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        SharedModule,
    ],
})
export class AuthConfirmationEmailComponent implements OnInit, OnDestroy {

    // alert: { type: FuseAlertType; message: string } = {
    //     type: 'success',
    //     message: '',
    // };
    // showNotification: boolean = false;
    // showAlert: boolean = false;
    counter: number = 120;
    interval: any;
    email: string = ''
    routerSignIn = `/${routeConfig.AUTH_SIGN_IN}`

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _authLayoutService: AuthLayoutService,
        private  _authService: AuthService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._authLayoutService.setImage('assets/images/auth/send-email.png');
        this._authLayoutService.setTitle('Receive an email?');
        this._authLayoutService.setTitleDes('Make things better for you');
        this.email =  this._authService._sendEmail || ''
        if(this._authService._sendEmail){
            this.startCountdown();
        } else {
            this._router.navigateByUrl(routeConfig.AUTH_FORGOT_PASS);
        }
    }
   
    ngOnDestroy(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the reset link
     */
    // sendResetLink(): void {
    //     // Return if the form is invalid
    //     if (this.forgotPasswordForm.invalid) {
    //         return;
    //     }

    //     // Disable the form
    //     this.forgotPasswordForm.disable();
    //     this.showAlert = false;

    //     const email = this.forgotPasswordForm.get("email").value

    //     // Forgot password
    //     this._authService
    //         .restPassword(email)
    //         .subscribe({
    //             next: () => {
    //                 // Xử lý thành công
    //                 this.showNotification = true;
    //                 this.startCountdown();
    //                 this.forgotPasswordForm.enable();
    //             },
    //             error: (err) => {
    //                 // Xử lý lỗi
    //                 this.showNotification = false;
    //                 // if (err.error.code === 2001) {
    //                 // this._alertService.showAlert({
    //                 //     title: this._translocoService.translate(
    //                 //         'forgot_password.title_error'
    //                 //     ),
    //                 //     message: this._translocoService.translate(
    //                 //         'forgot_password.email_not_registered'
    //                 //     ),
    //                 //     type: 'error',
    //                 // });
    //                 // }
    //                 this.alert = {
    //                     type: 'error',
    //                     message: '',
    //                 };
    
    //                 // Show the alert
    //                 this.showAlert = true;
    //                 this.forgotPasswordForm.enable();
    //             },
    //         });
    // }
    startCountdown(): void {
        this.counter = 120;

        if (this.interval) {
            clearInterval(this.interval);
        }

        this.interval = setInterval(() => {
            this.counter--;

            if (this.counter <= 0) {
                this.counter = 0; // Đảm bảo dừng ở 0
                clearInterval(this.interval);
            }
        }, 1000);
    }

    resendResetLink(): void {
        // this.sendResetLink(); // Gửi lại liên kết
        // this.startCountdown(); // Đếm lại từ đầu
        this._router.navigateByUrl(routeConfig.AUTH_CONFIN_EMAIL);

    }
}
