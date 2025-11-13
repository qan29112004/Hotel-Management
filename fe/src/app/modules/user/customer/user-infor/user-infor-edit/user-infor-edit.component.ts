import { Component, ViewEncapsulation, OnInit, ViewChild, inject, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared/shared.module';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { LayoutComponent } from 'app/layout/layout.component';
import { UserService } from 'app/core/profile/user/user.service';
import { switchMap } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslocoService, TranslocoModule } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { NewsService } from 'app/core/admin/news/news.service';
import { NgModel } from '@angular/forms';
import { ChatService } from 'app/core/chat/chat.service';

@Component({
    selector: 'app-user-infor-edit',
    standalone: true,
    imports: [SharedModule, CommonModule, FormsModule, TranslocoModule, MatTooltipModule, MatIconModule],
    templateUrl: './user-infor-edit.component.html',
    styles: ``,
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('fadeSlideIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate(
                    '200ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' })
                ),
            ]),
            transition(':leave', [
                animate(
                    '150ms ease-in',
                    style({ opacity: 0, transform: 'translateY(-10px)' })
                ),
            ]),
        ]),
    ],
})
export class UserInforEditComponent implements OnInit {
    user: any;

    isLoading: boolean = false;
    isEditMode = false;
    isAvatarEditorVisible = false;
    avatarPreviewUrl = '';
    today: string = new Date().toISOString().split('T')[0];
    errorFields: { [key: string]: string } = {};
    globalErrorMessage: string = '';
    @ViewChild('phoneInput') phoneInput!: NgModel;
    @ViewChild('inputAvatar') inputAvatar!: ElementRef<HTMLInputElement>;
    private _chatService=inject(ChatService);

    constructor(
        private _userService: UserService,
        private _translocoService: TranslocoService,
        private _alertService: AlertService,
        private _newsService: NewsService
    ) {}

    userInfoRows = [
        { key: 'username' },
        { key: 'fullName' },
        { key: 'phone' },
        { key: 'email' },
        { key: 'address' },
        { key: 'gender' },
        { key: 'birthday' },
    ];

    ngOnInit(): void {
        this.loadUserInfo();
    }

    loadUserInfo(): void {
        this.isLoading = true;
        this._userService
            .get()
            // .pipe(switchMap(() => this._userService.itemUser$))
            .subscribe({
                next: (userData) => {
                    if (!userData) {
                        console.warn('No user data found.');
                        return;
                    }
                    this.user = userData;
                    console.log("USER DATA: ", this.user)

                    this.isLoading = false;
                },
                error: () => {
                    console.error('User data load failed');
                    this.isLoading = false;
                },
            });
    }

    triggerAvatarEditor(isEditMode:boolean): void {
        if(isEditMode === true) {
            this.inputAvatar.nativeElement.click();}
    }

    toggleEditMode(): void {
        this.isEditMode = !this.isEditMode;
        if (this.isEditMode) {
            if (this.user?.birthday) {
                const isoDate = new Date(this.user.birthday);
                const yyyy = isoDate.getFullYear();
                const mm = String(isoDate.getMonth() + 1).padStart(2, '0');
                const dd = String(isoDate.getDate()).padStart(2, '0');
                this.user.birthday = `${yyyy}-${mm}-${dd}`; // HTML input format
            }
        } else {
            this.errorFields = {};
            this.globalErrorMessage = '';
            this.avatarPreviewUrl = '';
            this.isAvatarEditorVisible = false;
            this.loadUserInfo();
        }
    }

    clearFieldError(field: string): void {
        if (this.errorFields[field]) {
            delete this.errorFields[field];
        }
    }
    getStatus(statusId: number, key: string): string {
        const status = this._userService
            .getStatus()
            .find((s) => s.id === statusId);
        return status && key === 'name' ? status.name : status.class;
    }

    saveChanges(): void {
        if (!this.user) {
            console.warn('No user data to save.');
            return;
        }
        this.errorFields = {};
        console.log("USER : ", this.user)
        const dataUserUpdateFirebase = {
            avata:this.user.avatar,
            email: this.user.email,
            role: this.user.role,
            userId: this.user.id,
            username:this.user.username
        }
        console.log("DATA UPDATE FIREBASE: ", dataUserUpdateFirebase)
        this._chatService.updateUserDoc(this.user.id, this.user, dataUserUpdateFirebase);
        this._userService.update(this.user).subscribe({
            next: () => {
                
                this.isEditMode = false;
                console.log("INFOR SAU KHI UPDATE: ",this.user);
                this.loadUserInfo();
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'user_infor.success_title'
                    ),
                    message: this._translocoService.translate(
                        'user_infor.success_message'
                    ),
                    type: 'success',
                });
            },
            error: (err) => {
                console.error('Save user error:', err);

                if (
                    err?.error?.code === 'VALIDATION_ERROR' &&
                    Array.isArray(err.error.errors)
                ) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';

                        let code = field;
                        if (field === 'email') {
                            if (msg.includes('valid email')) {
                                code = 'email_invalid';
                            } else if (msg.includes('already exists')) {
                                code = 'email';
                            }
                        } else if (field === 'phone') {
                            if (msg.includes('valid phone')) {
                                code = 'phone_invalid';
                            } else if (msg.includes('already exists')) {
                                code = 'phone';
                            }
                        } else if (field === 'avatar') {
                            if (msg.includes('5mb')) {
                                code = 'avatar_max_size';
                            } else if (
                                msg.includes('jpg, png, gif, bmp, tiff, webp')
                            ) {
                                code = 'avatar_invalid_type';
                            } else {
                                code = 'avatar_not_found';
                            }
                        }
                        this.errorFields[field] = `errors.fields.${code}`;
                    });
                } else {
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.error_title'
                        ),
                        message:
                            this._translocoService.translate('errors.default'),
                        type: 'error',
                    });
                }
            },
        });
    }

    confirmAvatarChange(): void {
        if (!this.avatarPreviewUrl.trim()) {
            this.errorFields['avatar'] = 'errors.fields.avatar';
            return;
        }

        if (this.avatarPreviewUrl.startsWith('data:image')) {
            this.user.avatar = this.avatarPreviewUrl;
        } else {
            this.user.avatar = this.avatarPreviewUrl;
        }

        this.isAvatarEditorVisible = false;
        this.avatarPreviewUrl = '';
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            if (file.size > 5 * 1024 * 1024) {
                this.errorFields['avatar'] = 'errors.fields.avatar_max_size';
                return;
            }

            if (!file.type.startsWith('image/')) {
                this.errorFields['avatar'] =
                    'errors.fields.avatar_invalid_type';
                return;
            }

            const formData = new FormData();
            formData.append('image', file);
            this._userService.uploadImage(formData).subscribe({
                next: (res) => {
                    if (res?.data?.url) {
                        this.user.avatar = res.data.url;
                        this.avatarPreviewUrl = res.data.url;
                    }
                },
                error: (error) => {
                    console.error('Upload error:', error);
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.error_title'
                        ),
                        message: this._translocoService.translate(
                            'user_infor.error_avatar_upload'
                        ),
                        type: 'error',
                    });
                },
            });
        }
    }
}
