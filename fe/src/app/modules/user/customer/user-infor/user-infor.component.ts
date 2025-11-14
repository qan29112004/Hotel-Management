import { Component, ViewEncapsulation, OnInit, ViewChild, inject, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared/shared.module';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LayoutComponent } from 'app/layout/layout.component';
import { UserService } from 'app/core/profile/user/user.service';
import { switchMap } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { NewsService } from 'app/core/admin/news/news.service';
import { NgModel } from '@angular/forms';
import { ChatService } from 'app/core/chat/chat.service';
import { MatIconModule } from '@angular/material/icon';
import { NewsFeedComponent } from 'app/modules/auth/news-feed/news-feed.component';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';
import { UserInforEditComponent } from './user-infor-edit/user-infor-edit.component';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'app-user-infor',
    standalone: true,
    imports: [SharedModule, CommonModule, FormsModule, TranslocoModule, MatTooltipModule,MatIconModule, UserInforEditComponent],
    templateUrl: './user-infor.component.html',
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
export class UserInforComponent extends NewsFeedComponent implements OnInit {
    user: any;

    isLoading: boolean = false;
    isEditMode = false;
    isAvatarEditorVisible = false;
    avatarPreviewUrl = '';
    today: string = new Date().toISOString().split('T')[0];
    errorFields: { [key: string]: string } = {};
    globalErrorMessage: string = '';
    @ViewChild('phoneInput') phoneInput!: NgModel;
    tooltipUsername: boolean = true;
    tooltipFullname:boolean = true;
    tooltipPhone: boolean = true;
    tooltipEmail: boolean = true;
    tooltipAddress: boolean = true;
    tooltipGender: boolean = true;
    tooltipBirthday: boolean = true;
    tooltipTimers: { [key: string]: any } = {};
    private _chatService=inject(ChatService);

    showEditOverlay = false;

    constructor(
        _newsCategoryService: NewsCategoryService,
        _newsService: NewsService,
        _alertService: AlertService,
        translocoService: TranslocoService,
        _userService: UserService,
        _eref: ElementRef
    ) {
        super(
            _newsCategoryService,
            _newsService,
            _alertService,
            translocoService,
            _userService,
            _eref
        );
    }

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
        this._userService.itemUser$.subscribe(user => {
            this.currentUser = user || null;
            console.log("USER: ",this.currentUser)
        });
        this.loadNews();
        this.loadNewsCategory();
    }

    loadNews() {
        const payload = {
            filterRules: [
                {
                   "field":"created_by",
                   "option":"exact",
                   "value": this.currentUser.id
                }
            ]
        };
        // console.log('payload', payload);
        this._newsService.getNews(payload).subscribe(([news, totalNews]) => {
            // Xử lý news ở đây
            console.log("NEWS: ", news);
            this.news = news;
            // this.news = news.filter(newItem => newItem.createdBy.id === this.currentUser.id);
            this.news.forEach(post => this.getNewsComment(post.id));
            
        });
    }

    loadUserInfo(): void {
        this.isLoading = true;
        this._userService
            .get()
            .pipe(switchMap(() => this._userService.itemUser$))
            .subscribe({
                next: (userData) => {
                    if (!userData) {
                        console.warn('No user data found.');
                        return;
                    }
                    this.user = userData;

                    this.isLoading = false;
                },
                error: () => {
                    console.error('User data load failed');
                    this.isLoading = false;
                },
            });
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

    openEditOverlay(): void {
        this.showEditOverlay = true;
    }

    closeEditOverlay(): void {
        this.showEditOverlay = false;
        this._userService.itemUser$.subscribe(user => {
            this.currentUser = user || null;
            console.log("USER: ",this.currentUser)
        });
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
        this._userService.update(this.user).subscribe({
            next: () => {
                
                this.isEditMode = false;
                console.log(this.user);
                this.loadUserInfo();
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'user_infor.success_title'
                    ),
                    message: this.translocoService.translate(
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
                        title: this.translocoService.translate(
                            'other.error_title'
                        ),
                        message:
                            this.translocoService.translate('errors.default'),
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
                        title: this.translocoService.translate(
                            'other.error_title'
                        ),
                        message: this.translocoService.translate(
                            'user_infor.error_avatar_upload'
                        ),
                        type: 'error',
                    });
                },
            });
        }
    }
    
    showTooltip(field: 'username' | 'fullname' | 'phone' | 'email' | 'address' | 'gender' | 'birthday') {
        const key = `tooltip${field[0].toUpperCase()}${field.slice(1)}` as keyof UserInforComponent;

        // hiện tooltip
        (this as any)[key] = false;

        // clear timer cũ
        if (this.tooltipTimers[field]) {
            clearTimeout(this.tooltipTimers[field]);
        }

        // tạo timer mới
        this.tooltipTimers[field] = setTimeout(() => {
            (this as any)[key] = true;
        }, 2000);
        }

}
