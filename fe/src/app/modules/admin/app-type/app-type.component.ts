import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTypeService } from 'app/core/admin/app-type/app-type.service';
import { AppType } from 'app/core/admin/app-type/app-type.types';
import { NewsService } from 'app/core/admin/news/news.service';
import { forEach } from 'lodash';

@Component({
    selector: 'app-app-type',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './app-type.component.html',
    styles: ``
})
export class AppTypeComponent implements OnInit {
    constructor(
        private _appTypeService: AppTypeService,
        public translocoService: TranslocoService,
        private _alertService: AlertService,
        private _newsService: NewsService,
    ) {}


    appTypes: any[] = [];
    newApp: Partial<AppType> = {
        logo: '',
        title: '',
        appType: 1,
        secretKey: '',
        url: '',
        isLocked: false,
        industry: null,
        describe: ''
    };
    lockedAppIds = new Set<number>(); // hoặc string nếu id là string

    //tìm kiếm
    isSearching: boolean = false;
    searchText: string = '';
    // Phân trang
    currentPage: number = 1;
    pageSize: number = 10;
    totalApps: number = 0;
    totalPages: number = 0;

    // status
    statusOptions = this._appTypeService.getStatus();
    openDropdowns = new Set<string>();

    // industry
    industryOptions = this._appTypeService.getIndustry();

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    checkboxSelected: any[] = [];

    showUpdateAppPopup = false;
    showDeletePopup = false;
    showAddAppPopup = false;
    showDeleteAllPopup: boolean = false;
    selectedAppId: number | null = null;

    //error hiển thị lỗi
    errorFields: { [key: string]: string } = {};

    isImageLoading = false;
    imageError = false;
    showImagePopup = false;
    imageUrl = '';

    ngOnInit(): void {
        this.loadApp();
    }

    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            filterRules: []
        };
        if (this.searchText) {
            payload.searchRule = {
                fields: ['title'],
                option: 'contains',
                value: this.searchText,
            };
        }
        if (this.sortField) {
            payload.sortRule = {
                field: this.sortField,
                option: this.sortOption,
            };
        }

        return payload;
    }

    loadApp(): void {
        const payload = this.getPayload();
        this._appTypeService.getAllApp(payload).subscribe(([appTypes, total]) => {
            this.appTypes = appTypes;
            this.totalApps = total;
            this.totalPages = Math.ceil(this.totalApps / this.pageSize);
        });
    }

    loadAppAndResetCheckbox() {
        this.loadApp();
        this.checkboxSelected = [];
    }


    onPageChange(page: number) {
        this.currentPage = page;
        this.loadApp();
        this.checkboxSelected = [];
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadApp();
        this.checkboxSelected = [];
    }

    sortBy(field: string) {
        if (this.sortField === field) {
            if (this.sortOption === 'asc') {
                this.sortOption = 'desc';
            } else if (this.sortOption === 'desc') {
                this.sortField = null;
                this.sortOption = null;
            } else {
                this.sortOption = 'asc';
            }
        } else {
            this.sortField = field;
            this.sortOption = 'asc';
        }
        this.loadApp();
    }

    onSearchChange() {
        this.currentPage = 1;
        // console.log('this.searchText', this.searchText);
        this.loadApp();
    }

    clearSearch(): void {
        this.searchText = '';
        this.onSearchChange(); // Gọi lại hàm lọc nếu cần
      }

    toggleLock(appType: any): void {
        appType.isLocked = !appType.isLocked;
        const newApp: Partial<AppType> = {
            isLocked: appType.isLocked,
        };
        this._appTypeService.updateApp(appType.id, newApp).subscribe({
            next: () => {}});
    }

    toggleLockAll(appTypes: any[], lock: boolean): void {
        // Tạo mảng các ID của các appTypes cần thay đổi trạng thái khóa (khóa hoặc mở khóa)
        const appIdsToUpdate = appTypes.filter(app => app.isLocked !== lock)  // Lọc các app chưa ở trạng thái cần thay đổi
                                        .map(app => app.id);
    
        if (appIdsToUpdate.length > 0) {
            // Gửi API request để khóa hoặc mở khóa tất cả các app chưa bị khóa hoặc chưa mở khóa
            this._appTypeService.lockMultipleApps(appIdsToUpdate, lock).subscribe({
                next: () => {
                    // Cập nhật trạng thái `isLocked` cho tất cả ứng dụng đã được khóa hoặc mở khóa
                    appTypes.forEach(app => {
                        if (appIdsToUpdate.includes(app.id)) {
                            app.isLocked = lock;  // Cập nhật theo giá trị lock (true = khóa, false = mở khóa)
                        }
                    });
                    this.loadAppAndResetCheckbox();
                },
                error: (error) => {
                    console.error('Error locking/unlocking apps:', error);
                    this.loadAppAndResetCheckbox();
                }
            });
        } else {
            // Nếu không có gì thay đổi, vẫn nên load lại để đồng bộ UI
            this.loadAppAndResetCheckbox();
        }
    }
    
    

    openAddAppPopup() {
        this.showAddAppPopup = true;
    }

    closeAddAppPopup() {
        this.showAddAppPopup = false;
        this.newApp = { logo: '', title: '', appType: null, secretKey: '', describe: '', url: '', isLocked: false }; // Reset form
        this.errorFields = {};
    }

    createApp(): void {
        this.errorFields = {};
        if (!this.newApp.industry) {
            this.errorFields['industry'] = `errors.fields.industry`
            return;
        }
        if (!this.newApp.title) {
            this.errorFields['title'] = `errors.fields.title`
            return;
        }
        if (!this.newApp.url) {
            this.errorFields['url'] = `errors.fields.url`
            return;
        }
        this._appTypeService.createApp(this.newApp).subscribe({
            next: () => {
                this.closeAddAppPopup();
                this.loadApp();
                this._alertService.showAlert({
                    title: this.translocoService.translate('app_type.success_title'),
                    message: this.translocoService.translate('app_type.success_create_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                if (err?.error?.code === 'VALIDATION_ERROR' && Array.isArray(err.error.errors)) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        let code = field;
                        
                        if (field === 'title') {
                            if (msg.includes('already exists')) {
                                code = 'title_exists';
                            }
                        }
                        this.errorFields[field] = `errors.fields.${code}`;
                    });
                } else {
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('errors.default'),
                        type: 'error'
                    });
                }
            }
        });
    }

    openUpdateAppPopup(appType: any) {
        if (!appType) {
            this._alertService.showAlert({
                title: this.translocoService.translate('app_type.error_title'),
                message: this.translocoService.translate('app_type.error_select_app'),
                type: 'error'
            });
            return;
        }
        this.selectedAppId = appType.id;
        this.newApp = {
            logo: appType.logo,
            title: appType.title,
            appType: appType.appType,
            secretKey: appType.secretKey,
            url: appType.url,
            industry: appType.industry,
            describe: appType.describe
        };
        this.showUpdateAppPopup = true;
    }

    closeUpdateAppPopup() {
        this.showUpdateAppPopup = false;
        this.newApp = { logo: '', title: '', appType: null, secretKey: '', url: '', industry: null, describe: '' };
        this.errorFields = {};
    }

    submitUpdateApp(): void {
        this.errorFields = {};
        this._appTypeService.updateApp(this.selectedAppId, this.newApp).subscribe({
            next: () => {
                this.closeUpdateAppPopup();
                this.checkboxSelected = [];
                this.loadApp();
                this._alertService.showAlert({
                    title: this.translocoService.translate('app_type.success_title'),
                    message: this.translocoService.translate('app_type.success_update_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                console.error('Update category error:', err);
                if (err?.error?.code === 'VALIDATION_ERROR' && Array.isArray(err.error.errors)) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        let code = field;
                        
                        // if (field === 'title') {
                        //     if (msg.includes('already exists')) {
                        //         code = 'name_exists';
                        //     }
                        // } else if (field === 'url') {
                        //     if (msg.includes('already exists')) {
                        //         code = 'slug_exists';
                        //     }
                        // } else if (field === 'app_type') {
                        //     if (msg.includes('already exists')) {
                        //         code = 'appType_exists';
                        //     }
                        // }
                        this.errorFields[field] = `errors.fields.${code}`;
                    });
                } else {
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('errors.default'),
                        type: 'error'
                    });
                }
            }
        });
    }

    clearFieldError(field: string): void {
        if (this.errorFields[field]) {
            delete this.errorFields[field];
        }
    }

    handleImageLoad(event: Event) {
        this.isImageLoading = false;
        this.imageError = false;
    }

    handleImageError(event: Event) {
        this.isImageLoading = false;
        this.imageError = true;
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            this.isImageLoading = true;
            this.imageError = false;

            try {
    
                if (!file.type.startsWith('image/')) {
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('app_type.error_image_format'),
                        type: 'error'
                    });
                    this.isImageLoading = false;
                    return;
                }
    
                const formData = new FormData();
                formData.append('image', file);
    
                this._newsService.uploadImage(formData).subscribe({
                    next: (res) => {
                        if (res?.data?.url) {
                            this.newApp.logo = res.data.url;
                            this.isImageLoading = false;
                        }
                    },
                    error: (error) => {
                        console.error('Upload error:', error);
                        this.imageError = true;
                        this.isImageLoading = false;
                        this._alertService.showAlert({
                            title: this.translocoService.translate('other.error_title'),
                            message: this.translocoService.translate('app_type.error_image_upload'),
                            type: 'error'
                        });
                    }
                });
            } catch (error) {
                console.error('Upload error:', error);
                this.imageError = true;
                this.isImageLoading = false;
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('app_type.error_image_upload'),
                    type: 'error'
                });
            }
        }
    }

    openDeletePopup(appType: any) {
        this.showDeletePopup = true;
        this.selectedAppId = appType.id;
    }

    closeDeletePopup() {
        this.showDeletePopup = false;
        this.selectedAppId = null;
    }

    deleteApp() {
        if (!this.selectedAppId) return;
        this._appTypeService.deleteApp(this.selectedAppId).subscribe({
            next: () => {
                this.closeDeletePopup();
                this.loadApp();
                this._alertService.showAlert({
                    title: this.translocoService.translate('app_type.success_title'),
                    message: this.translocoService.translate('app_type.success_delete_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                console.error('Delete category error:', err);
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('errors.default'),
                    type: 'error'
                });
            }
        });
    }

    isAllSelected(): boolean {
        const unlockedAppTypes = this.appTypes.filter(app => !app.isLocked);

        // Nếu không có app nào không bị khóa, trả về false
        if (unlockedAppTypes.length === 0) {
            return false;
        }

        // Kiểm tra nếu tất cả appTypes không bị khóa đều được chọn
        return unlockedAppTypes.every(app => app.selected);
    }
    

    onCheckboxChange(event: Event, app: any) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
    
        if (isChecked) {
            this.checkboxSelected.push(app);
            app.selected = true;
        } else {
            this.checkboxSelected = this.checkboxSelected.filter(a => a.id !== app.id);
            app.selected = false;
        }
    }
    

    onCheckboxChangeAll(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
    
        if (isChecked) {
            this.checkboxSelected = this.appTypes;
            this.appTypes.forEach((apps) => {
                apps.selected = true;
            });
            console.log('checkboxSelected', this.checkboxSelected);
        } else {
            this.checkboxSelected = [];
            this.appTypes.forEach((apps) => {
                apps.selected = false;
            });
            console.log('checkboxSelected', this.checkboxSelected);
        }
    }
    
    get hasLockedApps(): boolean {
        return this.checkboxSelected.some(app => app.isLocked);
    }

    get hasUnlockedApps(): boolean {
        return this.checkboxSelected.some(app => !app.isLocked);
    }

    lockSelectedApps() {
        this.toggleLockAll(this.checkboxSelected, true);
    }

    lockApp(app: AppType) {
        console.log(app.isLocked)
        if (!app.isLocked) {
            this.toggleLock(app);
        }
    }
    
    unlockSelectedApps() {
        // this.checkboxSelected.forEach(app => {
        //     if (app.isLocked) {
        //         this.toggleLock(app);
        //     }
        // });
        this.toggleLockAll(this.checkboxSelected, false);
    }

    unlockApp(app: AppType) {
        if (app.isLocked) {
            this.toggleLock(app);
        }
    }


    openDeleteAllPopup() {
        this.showDeleteAllPopup = true;
    }

    closeDeleteAllPopup() {
        this.showDeleteAllPopup = false;
        this.checkboxSelected.forEach(item => item.selected = false);
        this.checkboxSelected = [];
        this.currentPage = 1;
    }

    deleteAllApps() {
        this.checkboxSelected.forEach(app => {
            this._appTypeService.deleteApp(app.id).subscribe({
                next: () => {
                    this.closeDeleteAllPopup();
                    this.loadApp();
                    this._alertService.showAlert({
                        title: this.translocoService.translate('app_type.success_title'),
                        message: this.translocoService.translate('app_type.success_delete_message'),
                        type: 'success'
                    });
                },
                error: (err) => {
                    console.error('Delete all app_types error:', err);
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('errors.default'),
                        type: 'error'
                    });
                }
            });
        });
    }

    getStatus(statusId: number, key: string): string {
        const status = this.statusOptions.find((s) => s.id === statusId);
        if (!status) return '';
        return key === 'name' ? status.name : status.class;
    }

    getIndustry(industryId: number, key: string): string {
        const industry = this.industryOptions.find((s) => s.id === industryId);
        if (!industry) return '';
        return key === 'name' ? industry.name : industry.class;
    }

    toggleDropdown(appId: string): void {
        if (this.openDropdowns.has(appId)) {
            this.openDropdowns.delete(appId);
        } else {
            this.openDropdowns.clear();
            this.openDropdowns.add(appId);
        }
    }

    isDropdownOpen(appId: string): boolean {
        return this.openDropdowns.has(appId);
    }

    changeStatus(app: any, appStatusId: number): void {
        if (app.status !== appStatusId) {
            this._appTypeService.updateApp(app.id, { status: appStatusId }).subscribe({
                next: (res) => {
                    this.loadApp();
                    this._alertService.showAlert({
                        title: this.translocoService.translate('app_type.success_title'),
                        message: this.translocoService.translate('app_type.success_update_status_message'),
                        type: 'success'
                    });
                },
            });
            app.status = appStatusId; // Cập nhật local luôn nếu muốn
        }
        this.checkboxSelected = [];
        this.closeDropdown(app.id);
    }


    changeIndustry(app: any, appIndustryId: number): void {
        if (app.industry !== appIndustryId && app.id) {
            this._appTypeService.updateApp(app.id, { industry: appIndustryId }).subscribe({
                next: (res) => {
                    this.loadApp();
                    this._alertService.showAlert({
                        title: this.translocoService.translate('app_type.success_title'),
                        message: this.translocoService.translate('app_type.success_update_status_message'),
                        type: 'success'
                    });
                },
            });
        }
        app.industry = appIndustryId; // Cập nhật local luôn nếu muốn
        this.checkboxSelected = [];
        this.closeDropdown(app.id);
    }

    closeDropdown(appId: string): void {
        this.openDropdowns.delete(appId);
    }
}   