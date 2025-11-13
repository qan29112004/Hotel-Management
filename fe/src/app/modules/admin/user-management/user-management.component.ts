import { Component, OnInit, ViewEncapsulation ,ViewChild,} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { EditUserComponent } from './edit-user/edit-user.component';
import { AddUserComponent } from './add-user/add-user.component';
import { FilterUserComponent } from './filter-user/filter-user.component';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { MatIconModule } from '@angular/material/icon';

import {
    User,
    UserResponse,
    Role,
} from 'app/core/admin/user-management/user-management.types';
import { debounceTime, Subject } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from 'app/core/alert/alert.service';
import { CardUserComponent } from './card-user/card-user.component';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { DeleteUserComponent } from './delete-user/delete-user.component';
import {
    ElementRef,
    QueryList,
    ViewChildren,
    HostListener,
} from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { LoginHistoryComponent } from './login-history/login-history.component';

@Component({
    standalone: true,
    selector: 'app-user-management',
    imports: [
        SharedModule,
        EditUserComponent,
        AddUserComponent,
        MatTooltipModule,
        CardUserComponent,
        CustomPaginationComponent,
        DeleteUserComponent,
        LoginHistoryComponent,
        FilterUserComponent,
        MatIconModule,
    ],
    templateUrl: './user-management.component.html',
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
export class UserManagementComponent implements OnInit {
    @ViewChild('filterPopup', { read: ElementRef }) filterPopupRef!: ElementRef;
    @ViewChild('filterToggleBtn', { read: ElementRef })

    // Trạng thái tải dữ liệu
    isLoading: boolean = false;

    // Dữ liệu
    userList: User[] = [];
    statusSummary: any = {
        active: 0,
        waiting: 0,
        inactive: 0,
    };

    // Tìm kiếm
    searchValue: string = '';
    searchInputChanged: Subject<string> = new Subject<string>();

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // Phân trang
    totalRecords: number = 0;
    totalItems: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;

    // Chọn user
    selectedUserIds: number[] = [];

    // xử lí checkbox
    showDeleteUserForm: boolean = false;
    selectedUserIdToDelete: number | null = null;
    hasSelectedUsers: boolean = false;
    showBulkDeleteUserForm: boolean = false; // cho xóa nhiều
    showSingleDeleteUserId: number | null = null;

    // Status và Role options
    statusOptions = this._userManagementService.getStatus();
    roleOptions = this._userManagementService.getRole();
    openDropdowns = new Set<string>();

    // Filter properties
    selectedStatusIds: number[] = [];
    selectedRoleIds: number[] = [];
    openFilterDropdowns = new Set<string>();
    externalFilters: any = {};
    filterToggleBtnRef!: ElementRef;
    selectedCreateAt : string = '';


    //history
    showLoginHistoryPopup = false;
    selectedUserForHistory: User = null;

    @ViewChildren('dropdownRef') dropdownRefs!: QueryList<ElementRef>;
    @ViewChildren('statusDropdownRef')
    statusDropdownRef!: QueryList<ElementRef>;
    @ViewChildren('roleDropdownRef') roleDropdownRef!: QueryList<ElementRef>;
    @ViewChild(FilterUserComponent) filterUserComponent!: FilterUserComponent;

    constructor(
        private _userManagementService: UserManagementService,
        private _alertService: AlertService,
        private datePipe: DatePipe,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.loadData();
        this.searchInputChanged
            .pipe(debounceTime(500))
            .subscribe(() => this.reloadUsers());
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsidePopup =
        this.filterPopupRef?.nativeElement?.contains(target);
    const clickedInMaterialOverlay = !!target.closest('.cdk-overlay-container');

    const clickedInsideAnyDropdown = this.dropdownRefs.some((dropdownRef) =>
        dropdownRef.nativeElement.contains(target)
    );
    const clickedInsideStatusDropdown = this.statusDropdownRef.some((dropdownRef) =>
        dropdownRef.nativeElement.contains(target)
    );
    const clickedInsideRoleDropdown = this.roleDropdownRef.some((dropdownRef) =>
        dropdownRef.nativeElement.contains(target)
    );

    // Xử lý đóng form filter
    if (!clickedInsidePopup && !clickedInMaterialOverlay) {
        this.showFilter = false;
    }

    // Xử lý đóng dropdown
    if (
        !clickedInsideAnyDropdown &&
        !clickedInsideStatusDropdown &&
        !clickedInsideRoleDropdown &&
        !clickedInMaterialOverlay
    ) {
        this.openDropdowns.clear();
        this.openFilterDropdowns.clear();
    }
}





    // Filter Methods
    
    onApplyUserFilter(filters: any): void {
      this.externalFilters = filters;
      this.reloadUsers(); 
    }

    toggleFilterDropdown(filterType: string): void {
        if (this.openFilterDropdowns.has(filterType)) {
            this.openFilterDropdowns.delete(filterType);
        } else {
            this.openFilterDropdowns.clear();
            this.openFilterDropdowns.add(filterType);
        }
    }

    isFilterDropdownOpen(filterType: string): boolean {
        return this.openFilterDropdowns.has(filterType);
    }

    onStatusFilterChange(statusId: number, event: any): void {
        if (event.target.checked) {
            if (!this.selectedStatusIds.includes(statusId)) {
                this.selectedStatusIds.push(statusId);
            }
        } else {
            this.selectedStatusIds = this.selectedStatusIds.filter(
                (id) => id !== statusId
            );
        }

        this.reloadUsers();
    }

    onRoleFilterChange(roleId: number, event: any): void {
        if (event.target.checked) {
            if (!this.selectedRoleIds.includes(roleId)) {
                this.selectedRoleIds.push(roleId);
            }
        } else {
            this.selectedRoleIds = this.selectedRoleIds.filter(
                (id) => id !== roleId
            );
        }
        this.reloadUsers();
    }

    removeStatusFilter(statusId: number): void {
        this.selectedStatusIds = this.selectedStatusIds.filter(
            (id) => id !== statusId
        );
        this.reloadUsers();
    }

    removeRoleFilter(roleId: number): void {
        this.selectedRoleIds = this.selectedRoleIds.filter(
            (id) => id !== roleId
        );
        this.reloadUsers();
    }

    clearAllFilters(): void {
    this.selectedStatusIds = [];
    this.selectedRoleIds = [];
    this.externalFilters = {};
    this.selectedUserIds = [];
    this.filterUserComponent?.resetForm();
    this.loadUsers()
}

    // checkbox
    openDeleteForm(id: number): void {
    this.showSingleDeleteUserId = id;
    this.selectedUserIds = []; // Reset danh sách xóa nhiều
    this.showBulkDeleteUserForm = true;
}

openDeleteFormMultiple(): void {
    if (this.selectedUserIds.length === 0) return;
    this.showSingleDeleteUserId = null; // Không xóa 1, mà xóa nhiều
    this.showBulkDeleteUserForm = true;
}

cancelDeleteForm(): void {
    this.showBulkDeleteUserForm = false;
    this.showSingleDeleteUserId = null;
}

onDeleteRefresh(): void {
    this.cancelDeleteForm();
    this.reloadUsers();
}
    hasActiveFilters(): boolean {
        return (
            this.selectedStatusIds.length > 0 || this.selectedRoleIds.length > 0
        );
        
    }
    // cái này của form
    hasExternalFilters(): boolean {
    return Object.values(this.externalFilters).some(
        (v) => v !== '' && v !== null && v !== undefined
    );

}

    getFilterRule(): any[] {
        const filters: any[] = [];

        if (this.selectedStatusIds.length > 0) {
            filters.push({
                field: 'status',
                option: 'in',
                value: this.selectedStatusIds,
            });
        }

        if (this.selectedRoleIds.length > 0) {
            filters.push({
                field: 'role',
                option: 'in',
                value: this.selectedRoleIds,
            });
        }

        // filter từ bộ lọc
        if (this.externalFilters && Array.isArray(this.externalFilters)) {
    filters.push(...this.externalFilters);
  }

        return filters;
    }

    // Tải dữ liệu
    loadData(): void {
        this.loadUsers();
    }


    loadUsers(): void {
        this.isLoading = true;
        this.selectedUserIds = [];

        const payload = this.getPayload();
        console.log(payload);

        this._userManagementService.getUsers(payload).subscribe({
            next: (response: UserResponse) => {
                this._userManagementService.users$.subscribe((users) => {
                    this.userList = users.map(user => {
                        // Nếu có avatar và bắt đầu bằng link Googleusercontent
                        if (user.avatar && user.avatar.startsWith("https://lh3.googleusercontent.com")) {
                            user.avatar = user.avatar.replace("https://lh3.googleusercontent.com", "/proxy/google-image/");
                        }
                        return user;
                    });
                    this.updateSelectedIds()
                });
                console.log(response)
                this.totalItems = response.data.totalUser;
                const { active, inactive } =
                    response.data.statusSummary;
                this.statusSummary = { active, inactive };
                this.totalRecords =
                    this.statusSummary.active +
                    this.statusSummary.inactive;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('API Error:', err);
            },
        });
    }


    reloadUsers(): void {
        this.currentPage = 1;
        this.loadUsers();
    }

    formatDateTime(dateStr: string): string | null {
        return this.datePipe.transform(dateStr, 'dd/MM/yyyy HH:mm', '+0700');
    }
    formatDateTimeUnix(timestamp: number): string | null {
        const date = new Date(timestamp * 1000); // chuyển từ giây sang mili-giây
        return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm', '+0700');
    }

    onSearchChange(): void {
        this.searchInputChanged.next(this.searchValue);
    }

    getSearchRule(): any {
        const defaultSearchFields = {
            fields: ['full_name', 'username', 'email', 'phone'],
            option: 'contains',
            value: this.searchValue.trim(),
        };
        return this.searchValue?.trim() ? defaultSearchFields : {};
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
        this.loadUsers();
    }

    getSortRule(): any {
        if (!this.sortField || !this.sortOption) {
            return {};
        }
        return {
            field: this.sortField,
            option: this.sortOption,
        };
    }

    // Updated payload method to include filters
    getPayload() {
        const filterRules = this.getFilterRule();
        const payload: any = {
            page_index: this.currentPage,
            page_size: this.pageSize,
            search_rule: this.getSearchRule(),
            sort_rule: this.getSortRule(),
        };

        // Add filter rules
        if (Object.keys(filterRules).length > 0) {
            payload.filterRules = filterRules;
        }

        return payload;
    }

    getStatus(statusId: number, key: string): string {
        const status = this._userManagementService
            .getStatus()
            .find((s) => s.id === statusId);
        return status && key === 'name' ? status.name : status.class;
    }

    getRole(roleId: number, key: string): string {
        const roles = this._userManagementService
            .getRole()
            .find((r) => r.id === roleId);
        return roles && key === 'name' ? roles.name : roles.class;
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadUsers();
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.reloadUsers();
    }

    onIndividualCheckboxChange(isChecked: boolean, user: User): void {
        if (user.status == 3) {
            if (isChecked) {
                this.selectedUserIds.push(user.id);
            } else {
                this.selectedUserIds = this.selectedUserIds.filter(
                    (id) => id !== user.id
                );
            }
        }
    }
    deleteSelectedUsers(): void {
  this.selectedUserIds = this.userList
    .filter(u => u.selected)
    .map(u => u.id);

  if (this.selectedUserIds.length > 0) {
    this.showSingleDeleteUserId = null; // reset single delete
    this.showBulkDeleteUserForm = true;
  }
}

    onToggleSelectAll(): void {
        const selectableIds = this.userList
            .filter((user) => user.status === 3)
            .map((user) => user.id);
        const selectedCount = this.selectedUserIds.filter((id) =>
            selectableIds.includes(id)
        ).length;

        if (selectedCount === 0) {
            this.selectedUserIds = [...selectableIds];
        } else {
            this.selectedUserIds = [];
        }
    }

    // xử lí check box
    
    handleUserDeleted(): void {
    this.selectedUserIds = [];             
    this.hasSelectedUsers = false;         
    this.reloadUsers();                    
}
    toggleSelectAll(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.userList.forEach((user) => (user.selected = checked));
        this.updateSelectedIds();
    }
    updateSelectedIds(): void {
        this.selectedUserIds = this.userList
            .filter((user) => user.selected)
            .map((user) => user.id);

        this.hasSelectedUsers = this.selectedUserIds.length >= 1;
    }
    
    openSingleDeleteForm(id: number): void {
        this.showBulkDeleteUserForm = true;
        this.showSingleDeleteUserId = id;
    }

       openBulkDeleteForm(id?: number): void {
        if (id) {
            this.selectedUserIds = [id]; // click icon thì chỉ xoá 1 user
        }
        if (this.selectedUserIds.length === 0) return; // vẫn chặn nếu không truyền id và không chọn ai
        this.showBulkDeleteUserForm = true;
    }

    // Show popup
    showEditUser = false;
    showAddUser = false;
    showImport = false;
    showFilter = false;
    showFilterModal = false; 


    toggleEditUserDrawer(user: User) {
        if (user) {
            this._userManagementService.setItemUser(user);
        }
        this.showEditUser = !this.showEditUser;
    }
    toggleFilterUserDrawer() {
        this.showFilter = !this.showFilter;
    }

    toggleAddUserDrawer(): void {
        this.showAddUser = !this.showAddUser;
    }

    toggleEditFilterDrawer():void{
        this.showFilter = !this.showFilter;
    }



    drawerOpenedChanged(opened: boolean): void {
        this.showAddUser = opened;
    }

    drawerOpenedChangedEdit(opened: boolean): void {
        this.showEditUser = opened;
    }

    drawerOpenedChangedFilter(opened: boolean): void {
        this.showFilter = opened;
    }

    openImport() {
        this.showImport = true;
    }

    closeImport() {
        this.showImport = false;
    }

    isDropdownOpen(userId: string): boolean {
        return this.openDropdowns.has(userId);
    }

    toggleDropdown(userId: string): void {
        if (this.openDropdowns.has(userId)) {
            this.openDropdowns.delete(userId);
        } else {
            this.openDropdowns.clear();
            this.openDropdowns.add(userId);
        }
    }

    closeDropdown(userId: string): void {
        this.openDropdowns.delete(userId);
    }

    changeStatus(user: any, newStatus: number): void {
        if (user.status !== newStatus) {
            this.updateUserStatus(user.id, newStatus);
            user.status = newStatus;
        }
        this.closeDropdown(user.id);
    }

    private updateUserStatus(userId: string, status: number): void {
        const user = this.userList.find((u) => u.id === +userId);
        if (user) {
            user.status = status;
            this._userManagementService.update(user).subscribe({
                next: (res) => {
                    this.loadUsers();
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: this._translocoService.translate(
                            'user_management.edit.message_success'
                        ),
                        type: 'success',
                    });
                },
            });
        }
    }

    /**
     * Open login history popup for a specific user
     */
    openLoginHistoryPopup(user: User) {
        this.selectedUserForHistory = user;
        this.showLoginHistoryPopup = true;
    }

    /**
     * Close login history popup
     */
    closeLoginHistoryPopup() {
        this.showLoginHistoryPopup = false;
        this.selectedUserForHistory = null;
    }
}
