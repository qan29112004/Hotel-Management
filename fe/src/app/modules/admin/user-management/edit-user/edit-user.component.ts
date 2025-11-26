import { CommonModule, NgIf } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
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
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import {
    Status,
    Role,
} from 'app/core/admin/user-management/user-management.types';
import { AlertService } from 'app/core/alert/alert.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserManagementComponent } from '../user-management.component';
import { AuthService } from 'app/core/auth/auth.service';
import { FuseDrawerComponent } from '@fuse/components/drawer';
import { fuseAnimations } from '@fuse/animations';
import { User } from 'app/core/profile/user/user.types';
import { TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'app-edit-user',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        SharedModule,
        FuseDrawerComponent,
    ],
    templateUrl: './edit-user.component.html',
    styles: ``,
})
export class EditUserComponent implements OnInit {
    @Input() showEditUser: boolean = false;
    @Output() toggleEditUserDrawer = new EventEmitter<User>();
    @Output() drawerOpenedChangedEdit = new EventEmitter<boolean>();

    @ViewChild('editForm') editForm: NgForm;

    alert: { type: FuseAlertType; code: any } = {
        type: 'success',
        code: '',
    };
    editUserForm: UntypedFormGroup;
    showAlert: boolean = false;
    isStatus: boolean = true;
    isRole: boolean = true;
    isPasswordVisible = false;

    status: Status[] = [];
    role: Role[] = [];

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _userManagementService: UserManagementService,
        private _alertService: AlertService,
        private userManagement: UserManagementComponent,
        private _authService: AuthService,
        private _translocoService: TranslocoService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form

        this.editUserForm = this._formBuilder.group({
            id: [''],
            username: [{ value: '', disabled: true }, [Validators.required]],
            email: [
                { value: '', disabled: true },
                [Validators.required, Validators.email],
            ],
            fullName: [''],
            gender: ['other'],
            address: [''],
            password:['', [Validators.required]],
            status: [''],
            role: [''],
            birthday: ['', [AuthUtils.birthDateValidator()]],
            phone: ['', [Validators.required, AuthUtils.phoneValidator()]],
        });
        this.loadStatus();
        this.loadRole();
        this._userManagementService.itemUser$.subscribe((user) => {
            if (user) {
                this.editUserForm.patchValue({
                    id: user.id || '',
                    username: user.username || '',
                    email: user.email || '',
                    fullName: user.fullName || '',
                    address: user.address || '',
                    gender: user.gender || 'other',
                    status: user.status || '',
                    password:'',
                    role: user.role || '',
                    birthday: user.birthday ?? null,
                    phone: user.phone || '',
                });
                this.editUserForm.get('username')?.disable();
                this.editUserForm.get('email')?.disable();
                this.isStatus = user.status === 3;
                this.isRole = user.role === 3;
            }
        });
    }
    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }
    onToggleClick(): void {
        // Gửi sự kiện lên cha

        this.showAlert = false;
        this.toggleEditUserDrawer.emit();
    }

    onDrawerOpenedChange(opened: boolean): void {
        this.editForm.resetForm();
        this.loadStatus();
        this.loadRole();
        this._userManagementService.itemUser$.subscribe((user) => {
            if (user) {
                this.editUserForm.patchValue({
                    id: user.id || '',
                    username: user.username || '',
                    email: user.email || '',
                    fullName: user.fullName || '',
                    address: user.address || '',
                    gender: user.gender || 'other',
                    password:'',
                    status: user.status || '',
                    role: user.role || '',
                    birthday: user.birthday ?? null,
                    phone: user.phone || '',
                });
                this.editUserForm.get('username')?.disable();
                this.editUserForm.get('email')?.disable();
                this.isStatus = user.status === 3;
                this.isRole = user.role === 3;
            }
        });
        this.drawerOpenedChangedEdit.emit(opened);
        if (opened) {
            this.showAlert = false;
        }
    }

    loadStatus(): void {
        this.status = this._userManagementService
            .getStatus()
            .filter((s) => !s.is_list);
    }

    loadRole(): void {
        this.role = this._userManagementService.getRole();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Save
     */
    save(): void {
        // Return if the form is invalid
        if (this.editUserForm.invalid) {
            return;
        }

        // Disable the form
        const rawBirthday = this.editUserForm.get('birthday')?.value;
        const formattedBirthday = rawBirthday
            ? new Date(rawBirthday).toISOString().split('T')[0]
            : null;

        // Cập nhật lại giá trị birthday trong form
        this.editUserForm.patchValue({ birthday: formattedBirthday });

        // Map role sang isStaff, isSuperuser
        const role = this.editUserForm.get('role')?.value;
        let isStaff = false;
        let isSuperuser = false;
        if (role === 1) {
            // admin
            isStaff = true;
            isSuperuser = true;
        } else if (role === 2) {
            // mod
            isStaff = true;
            isSuperuser = false;
        } else {
            // user
            isStaff = false;
            isSuperuser = false;
        }
        // Gộp vào payload
        const payload = {
            ...this.editUserForm.value,
            isStaff,
            isSuperuser,
        };
        this.editUserForm.disable();
        console.log('editUserForm on save:', this.editUserForm);
        // Hide the alert
        this.showAlert = false;

        this._userManagementService.update(payload).subscribe({
            next: (res) => {
                this.userManagement.loadUsers();

                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'other.success_title'
                    ),
                    message: this._translocoService.translate(
                        'user_management.edit.message_success'
                    ),
                    type: 'success',
                });

                // Reset form
                this.editUserForm.reset();
                this.editUserForm.enable();
                this.onToggleClick();
            },
            error: (err) => {
                const errorList = err?.error?.errors;
                this.alert = {
                    type: 'error',
                    code: Array.isArray(errorList)
                        ? errorList.map(e => e.field ? `${e.field}: ${e.message}` : e.message)
                        : [err?.error?.message || err?.error?.code || 'Đã xảy ra lỗi'],
                };

                this.showAlert = true;
                this.editUserForm.enable();
            },
        });
    }

    forgotFassword(): void {
        this._userManagementService.itemUser$.subscribe((user) => {
            if (user) {
                this._authService.restPassword(user.email).subscribe({
                    next: () => {
                        // Xử lý thành công
                        // this.forgotPasswordForm.enable();
                        this._alertService.showAlert({
                            title: 'other.success_title',
                            message:
                                'Đường dẫn đổi mật khẩu đã được gửi đến email của bạn',
                            type: 'success',
                        });
                    },
                    error: (err) => {
                        // Xử lý lỗi
                        console.log(err);
                        if (err.error.code === 'RESET_EMAIL_ALREADY_SENT') {
                            this._alertService.showAlert({
                                title: 'Thông báo thất bại',
                                message: err.error.message,
                                type: 'error',
                            });
                        }
                        // this.alert = {
                        //     type: 'error',
                        //     message: '',
                        // };

                        // // Show the alert
                        // this.showAlert = true;
                    },
                });
            }
        });
    }
}
