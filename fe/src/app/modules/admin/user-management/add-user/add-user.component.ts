import { CommonModule, NgIf } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
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
import { AlertService } from 'app/core/alert/alert.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UsernameSanitizeDirective } from '@fuse/directives/input-username/input-username.directive';
import { UserManagementComponent } from '../user-management.component';
import { FuseDrawerComponent } from '@fuse/components/drawer';
import { FuseNavigationService } from '@fuse/components/navigation';
import { fuseAnimations } from '@fuse/animations';
import { TranslocoService } from '@ngneat/transloco';

import {
    Status,
    Role,
} from 'app/core/admin/user-management/user-management.types';
@Component({
    selector: 'app-add-user',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        FuseAlertComponent,
        NgIf,
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        SharedModule,
        UsernameSanitizeDirective,
        FuseDrawerComponent,
    ],
    templateUrl: './add-user.component.html',
    styles: ``,
})
export class AddUserComponent {
    @Input() showAddUser: boolean = false;
    @Output() toggleAddUserDrawer = new EventEmitter<void>();

    @Output() drawerOpenedChanged = new EventEmitter<boolean>();

    alert: { type: FuseAlertType; code: any } = {
        type: 'success',
        code: [],
    };
    addUserForm: UntypedFormGroup;
    showAlert: boolean = false;

    status: Status[] = [];
    role: Role[] = [];
    isPasswordVisible = false; // Mặc định ẩn mật khẩu

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _userManagementService: UserManagementService,
        private _alertService: AlertService,
        private userManagement: UserManagementComponent,
        private _translocoService :TranslocoService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    onToggleClick(): void {
        // Gửi sự kiện lên cha
        this.clearForm();
        this.showAlert = false;
        this.toggleAddUserDrawer.emit();
    }

    // onCloseDrawer(): void {
    //     // Gửi sự kiện lên cha
    //     this.clearForm();
    //     this.showAlert = false;
    //     this.toggleAddUserDrawer.emit();
    // }
    /**
     * On init
     */
    ngOnInit(): void {
        this.addUserForm = this._formBuilder.group({
            username: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            phone: ['', [Validators.required, AuthUtils.phoneValidator()]],
            role: [null],
            fullName: [''],
            birthday: ['', [AuthUtils.birthDateValidator()]],
            address: [''],
            gender: ['other'],
            status: [null],
        });

        this.role = this._userManagementService.getRole();
        this.status = this._userManagementService
            .getStatus()
            .filter((s) => !s.is_list);
        this.getRoleAndStatusDefault();
    }

    onDrawerOpenedChange(opened: boolean): void {
        this.drawerOpenedChanged.emit(opened);
        if (opened) {
            this.showAlert = false;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create user
     */
    create(): void {
        if (this.addUserForm.invalid) {
            console.log(this.addUserForm)
            this.showAlert = true;
            this.alert = {
                type: 'error',
                code: ['errors.CO_E_024'],
            };
            return;
        }

        const rawBirthday = this.addUserForm.get('birthday')?.value;
        const formattedBirthday = rawBirthday
            ? new Date(rawBirthday).toISOString().split('T')[0]
            : null;

        // Cập nhật lại giá trị birthday trong form
        this.addUserForm.patchValue({ birthday: formattedBirthday });
        const formData = this.addUserForm.value;

        // Disable the form để ngăn người dùng submit lại
        this.addUserForm.disable();
        // Hide the alert
        this.showAlert = false;

        // Create

        this._userManagementService.create(formData).subscribe({
            next: (res) => {
                this.userManagement.reloadUsers();
                this._alertService.showAlert({
                    title: this._translocoService.translate('other.success_title'),
                    message: this._translocoService.translate('success.CM_S_008'),
                    type: 'success'
                });
                

                this.addUserForm.enable();
                this.clearForm();
                this.onToggleClick();
            },
            error: (err) => {
                console.log(err);

                const errorList = err?.error?.errors;
                this.alert = {
                    type: 'error',
                    code: Array.isArray(errorList)
                        ? errorList.map(e => e.field ? `${e.field}: ${e.message}` : e.message)
                        : [err?.error?.message || err?.error?.code || 'Đã xảy ra lỗi'],
                };

                this.addUserForm.enable();

                // Show the alert
                this.showAlert = true;
            },
        });
    }

    togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
    }
    getRoleAndStatusDefault() {
        this.addUserForm.get('role')?.patchValue(this.role[2].id);
        this.addUserForm.get('status')?.patchValue(this.status[0].id);
    }
    clearForm() {
        this.addUserForm.reset();
        this.getRoleAndStatusDefault();
    }
}
