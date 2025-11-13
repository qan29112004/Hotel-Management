import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { routeConfig } from 'app/core/uri/config.route';
import { SharedModule } from 'app/shared/shared.module';

@Component({
    selector: 'auth-change-password',
    templateUrl: './change-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        NgIf,
        RouterLink,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        SharedModule,
    ],
})
export class AuthChangePasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; code: string } = {
        type: 'success',
        code: '',
    };
    showAlert: boolean = false;

    resetPasswordForm: UntypedFormGroup;

    passwordTouched = false;

    passwordValidLength = false;
    passwordHasLowerCase = false;
    passwordHasUpperCase = false;
    passwordHasSpecialChar = false;
    passwordHasInvalidChar = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _alertService: AlertService,
        private _translocoService: TranslocoService,
        private _authLayoutService: AuthLayoutService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this._authLayoutService.setImage('assets/images/auth/new-password.png');
        this._authLayoutService.setTitle('Change the password. Secure.');
        this._authLayoutService.setTitleDes('Make things better for you');
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch(
                    'password',
                    'passwordConfirm'
                ),
            }
        );

        this.resetPasswordForm
            .get('password')
            ?.valueChanges.subscribe((password: string) => {
                this.passwordValidLength = password.length >= 8;
                this.passwordHasLowerCase = /[a-z]/.test(password);
                this.passwordHasUpperCase = /[A-Z]/.test(password);
                this.passwordHasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(
                    password
                );
            });
    }

    getValidationClass(condition: boolean): string {
        if (!this.passwordTouched) return '';
        return condition ? 'text-green-500' : 'text-red-500';
    }

    get isPasswordValid(): boolean {
        return (
            this.passwordValidLength &&
            this.passwordHasLowerCase &&
            this.passwordHasUpperCase &&
            this.passwordHasSpecialChar
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Reset password
     */
    resetPassword(): void {
        // Return if the form is invalid
        if (this.resetPasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.resetPasswordForm.disable();
        this.showAlert = false;

        // Send the request to the server
        this._authService
            .changePassword(this.resetPasswordForm.get('password')?.value)
            .subscribe(
                () => {
                    this._router.navigate([`/${routeConfig.AUTH_SIGN_IN}`]);

                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: this._translocoService.translate(
                            'change_password.change_password_success'
                        ),
                        type: 'success',
                    });
                },
                (err) => {
                    // Re-enable the form
                    this.resetPasswordForm.enable();

                    this.alert = {
                        type: 'error',
                        code: `errors.${err?.error?.code}` || 'errors.default',
                    };

                    // Show the alert
                    this.showAlert = true;
                }
            );
    }
}
