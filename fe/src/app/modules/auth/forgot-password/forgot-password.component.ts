import { CommonModule, NgIf } from '@angular/common';
import {
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import {  Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { routeConfig } from 'app/core/uri/config.route';
import { CustomInputComponent } from 'app/shared/components/custom-input/custom-input.component';
import { SharedModule } from 'app/shared/shared.module';

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgIf,
        CommonModule,
        SharedModule,
    ],
})
export class AuthForgotPasswordComponent implements OnInit {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;
    @ViewChild('emailInput') emailInput!: CustomInputComponent;

    alert: { type: FuseAlertType; code: string } = {
        type: 'success',
        code: '',
    };
    forgotPasswordForm: UntypedFormGroup;
    // showNotification: boolean = false;
    showAlert: boolean = false;
    counter: number = 120;
    interval: any;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        // private _translocoService: TranslocoService,
        // private _alertService: AlertService,
        private _router: Router,
        private _authLayoutService: AuthLayoutService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._authLayoutService.setImage(
            'assets/images/auth/forgot-password.png'
        );
        this._authLayoutService.setTitle('Reset a New Password');
        this._authLayoutService.setTitleDes(
            'Don’t worry, we help that on your password'
        );
        // Create the form
        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, AuthUtils.emailValidator]],
        });
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.emailInput.focus();
        });
    }
    // ngOnDestroy(): void {
    //     if (this.interval) {
    //         clearInterval(this.interval);
    //     }
    // }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the reset link
     */
    sendResetLink(): void {
        // Return if the form is invalid
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.forgotPasswordForm.disable();
        this.showAlert = false;

        const email = this.forgotPasswordForm.get('email').value;

        // Forgot password
        this._authService.restPassword(email).subscribe({
            next: () => {
                this.forgotPasswordForm.enable();
                this._authService.setSendEmail(email)

                this._router.navigateByUrl(routeConfig.AUTH_CONFIN_EMAIL);

               
                // Xử lý thành công
                // this.showNotification = true;
                // this.startCountdown();
            },
           error: (err) => {
            // this.showNotification = false;

            this.alert = {
                type: 'error',
                code: `errors.${err?.error?.code}` || 'errors.default', 
            };

            this.showAlert = true;
            this.forgotPasswordForm.enable();
        }
        });
    }
    // startCountdown(): void {
    //     this.counter = 120;

    //     if (this.interval) {
    //         clearInterval(this.interval);
    //     }

    //     this.interval = setInterval(() => {
    //         this.counter--;

    //         if (this.counter <= 0) {
    //             this.counter = 0; // Đảm bảo dừng ở 0
    //             clearInterval(this.interval);
    //         }
    //     }, 1000);
    // }

    // resendResetLink(): void {
    //     this.sendResetLink(); // Gửi lại liên kết
    //     this.startCountdown(); // Đếm lại từ đầu
    // }
}
