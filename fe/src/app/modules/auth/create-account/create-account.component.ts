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
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from 'app/core/auth/auth.service';
import { SharedModule } from 'app/shared/shared.module';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { FuseValidators } from '@fuse/validators';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { routeConfig } from 'app/core/uri/config.route';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-create-account',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        SharedModule,
        MatTooltipModule
    ],
    templateUrl: './create-account.component.html',
    styles: ``,
})
export class CreateAccountComponent implements OnInit {
    @ViewChild('createNgForm') createNgForm: NgForm;

    createForm: UntypedFormGroup;
    alert: { type: FuseAlertType; code: any } = {
        type: 'success',
        code: '',
    };

    showAlert: boolean = false;
    errorMessages: string[] = [];

    passwordTouched = false;
    isPasswordVisible = false; // Mặc định ẩn mật khẩu
    isPasswordConfirmVisible = false; // Mặc định ẩn mật khẩu

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
        this._authLayoutService.setImage(
            'assets/images/auth/create-account.png'
        );
        this._authLayoutService.setTitle('Startup your journey with us');
        this._authLayoutService.setTitleDes('Get started with world #1 Portal');
        this.createForm = this._formBuilder.group(
            {
                username: ['', [Validators.required]],
                email: ['', [Validators.required, AuthUtils.emailValidator]],
                phone: ['', [Validators.required, AuthUtils.phoneValidator()]],
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
        // get token param

        this.createForm
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

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }
    togglePasswordConfirmVisibility(): void {
        this.isPasswordConfirmVisible = !this.isPasswordConfirmVisible;
    }

    prepareSignUpData(): any {
        const formValue = this.createForm.value;

        return {
            phone: formValue.phone,
            password: formValue.password,
            email: formValue.email,
            username: formValue.username,
        };
    }

    /**
     * Create Account
     */
    createAccount(): void {
        // Check nếu form invalid hoặc passwordConfirm không khớp
        if (this.createForm.invalid) {
            return;
        }

        const password = this.createForm.get('password')?.value;
        const passwordConfirm = this.createForm.get('passwordConfirm')?.value;

        if (password !== passwordConfirm) {
            this.createForm
                .get('passwordConfirm')
                ?.setErrors({ mismatch: true });
            return;
        }

        this.errorMessages = []; // Reset trước khi thêm lỗi mới

        // Disable the form
        this.createForm.disable();
        this.showAlert = false;

        // Sign up
        this._authService.signUp(this.prepareSignUpData()).subscribe({
            next: () => {
                // Set the alert
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'other.success_title'
                    ),
                    message: this._translocoService.translate(
                        'create_account.title_success'
                    ),
                    type: 'success',
                });

                // Navigate to the redirect url
                this._router.navigate([`/${routeConfig.AUTH_SIGN_IN}`]);
            },
            error: (err) => {
                // Re-enable the form
                this.createForm.enable();
                this.alert = {
                    type: 'error',
                    code: [],
                };

                if (
                    err?.error?.code === 'VALIDATION_ERROR' &&
                    Array.isArray(err.error.errors)
                ) {
                    this.alert.code = err.error.errors.map((e: any) => {
                        return `errors.fields.${e.field}`;
                    });
                } else {
                    this.alert.code = [
                        `errors.${err?.error?.code}` || 'errors.default',
                    ];
                }

                // Show the alert
                this.showAlert = true;
            },
        });
    }
}
