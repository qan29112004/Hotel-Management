import { Component, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { User } from 'app/core/admin/user-management/user-management.types';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { debounceTime, Subject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from 'app/core/alert/alert.service';
import { Router } from '@angular/router';
import { routeConfig } from 'app/core/uri/config.route';
import { FilterComponent } from 'app/shared/components/filter/filter.component';
import { ImportFileComponent } from './import-file/import-file.component';
import {
    FuseConfirmationConfig,
    FuseConfirmationService,
} from '@fuse/services/confirmation';
import { TranslocoService } from '@ngneat/transloco';
import { CustomerService } from 'app/core/user/customer/customer.service';
import {
    CustomerResponse,
    RecordItem,
} from 'app/core/user/customer/customer.types';
import { FuseAlertType } from '@fuse/components/alert';

@Component({
    selector: 'app-customer',
    standalone: true,
    imports: [
        SharedModule,
        CommonModule,
        CdkScrollable,
        MatTooltipModule,
        FilterComponent,
        ImportFileComponent,
    ],
    templateUrl: './customer.component.html',
    styles: ``,
})
export class CustomerComponent {
    @ViewChild(FilterComponent) filterComponent!: FilterComponent;

    data: any[] = [];

    // Trạng thái tải dữ liệu
    isLoading: boolean = false;

    // Dữ liệu
    userList: RecordItem[] = [];
    totalRecords: number;
    filteredCustomers: RecordItem[] = [];

    // Tìm kiếm
    searchValue: string = '';
    searchInputChanged: Subject<string> = new Subject<string>();

    // Các giá trị filter
    selectedStatusIds: number[] = [];
    selectedAssgnedByIds: number[] = [];
    selectedDepartmentIds: number[] = [];
    selectedProvinIds: number[] = [];
    selectedDistrictsIds: number[] = [];
    selectedWardsIds: number[] = [];
    selectedCreateAtIds: number[] = [];
    selectedUpdateAtIds: number[] = [];
    selectedSourceIds: number[] = [];
    
    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // Phân trang
    currentPage: number = 1;
    pageSizeOptions: number[] = [10, 15, 20, 25];
    pageSize: number = this.pageSizeOptions[0];
    totalItems: number = 0;
    isDropdownOpen = false;

    // Chọn customer
    hasCheckedCustomer: boolean = false;
    selectedCustomerIds: number[] = [];

    // Status
    statusOptions = [
        { name: 'Khách hàng mới', id: 'khach_hang_moi' },
        { name: 'Tiềm năng', id: 'tiem_nang' },
        { name: 'Cơ hội', id: 'co_hoi' },
        { name: 'Chính thức', id: 'chinh_thuc' },
        { name: 'Rời bỏ', id: 'roi_bo' },
    ];

    // Tooltip
    user: any;
    tooltipContent: string = '';

    // Dữ liệu
    customerData: RecordItem[] = [];

    //Alert
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    showAlert: boolean = false;
    activeFilters: { label: string; key: string; count: number }[] = [];

    constructor(
        private _customerService: CustomerService,
        private _alertService: AlertService,
        private datePipe: DatePipe,
        private _router: Router,
        private _fuseConfirmationService: FuseConfirmationService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.searchInputChanged
            .pipe(debounceTime(500))
            .subscribe(() => this.reloadCustomers());

        this._customerService.filterForm$.subscribe((values) => {
            this.updateActiveFilters(values);
        });
    }

    updateActiveFilters(values: any) {
        const mapping: { [key: string]: string } = {
            status: 'Trạng thái',
            assigned_by: 'Người phụ trách',
            department: 'Phòng ban',
            address_provinces_name: 'Tỉnh/TP',
            address_districts_name: 'Quận/Huyện',
            address_wards_name: 'Phường/Xã',
            created_at: 'Ngày tạo',
            updated_at: 'Ngày cập nhật',
            source_name: 'Nguồn',
        };

        this.activeFilters = [];

        for (const key in values) {
            const value = values[key];
            if (Array.isArray(value) && value.length > 0) {
                this.activeFilters.push({
                    label: mapping[key] || key,
                    key,
                    count: value.length,
                });
            }
        }
    }
    getEmptyFilter(): any {
        this.selectedAssgnedByIds = [];
        this.selectedDepartmentIds = [];
        this.selectedProvinIds = [];
        this.selectedDistrictsIds = [];
        this.selectedWardsIds = [];
        this.selectedCreateAtIds = [];
        this.selectedUpdateAtIds = [];
        this.selectedSourceIds = [];
        this.selectedStatusIds = [];
        return {
            status: [],
            assigned_by: [],
            department: [],
            address_provinces_name: [],
            address_districts_name: [],
            address_wards_name: [],
            created_at: [],
            updated_at: [],
            source_name: [],
        };
    }

    clearFilter() {
        const empty = this.getEmptyFilter();
        this._customerService.filterForm = empty;
        this.updateActiveFilters(empty);
        this.filterComponent.resetForm();
        this.loadCustomers();
    }
    removeFilter(key: string) {
        switch (key) {
            case 'assigned_by':
                this.selectedAssgnedByIds = [];
                break;
            case 'department':
                this.selectedDepartmentIds = [];
                break;
            case 'address_provinces_name':
                this.selectedProvinIds = [];
                break;
            case 'address_districts_name':
                this.selectedDistrictsIds = [];
                break;
            case 'address_wards_name':
                this.selectedWardsIds = [];
                break;
            case 'created_at':
                this.selectedCreateAtIds = [];
                break;
            case 'updated_at':
                this.selectedUpdateAtIds = [];
                break;
            case 'source_name':
                this.selectedSourceIds = [];
                break;
            case 'status':
                this.selectedStatusIds = [];
                break;
        }

        // Xoá key khỏi activeFilters
        this.activeFilters = this.activeFilters.filter((f) => f.key !== key);
        this.filterComponent.resetFilterByKey(key);

        this.loadCustomers();
    }

    clickCreateForm() {
        this._router.navigateByUrl(
            `${routeConfig.ROUTER_ADMIN}/${routeConfig.ADD_FORM}`
        );
    }
    // Tải dữ liệu
    loadData(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.isLoading = true;

        this._customerService.getCustomerList(this.getPayload()).subscribe({
            next: (response: CustomerResponse) => {
                this._customerService.customers$.subscribe((customers) => {
                    this.customerData = customers;
                    this.userList = customers;
                    this.totalItems = response.data.total_records;
                    this.totalRecords = response.data.all_records;
                });
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('API Error:', err);
            },
        });
    }

    reloadCustomers(): void {
        this.currentPage = 1; // Reset lại về trang đầu
        this.loadCustomers();
    }

    formatDateTime(dateStr: string): string | null {
        return this.datePipe.transform(dateStr, 'HH:mm dd/MM/yyyy');
    }

    onSearchChange(): void {
        this.searchInputChanged.next(this.searchValue);
    }

    // Lấy các rule tìm kiếm
    getSearchRule(): any {
        const defaultSearchFields = {
            fields: ['data__full_name', 'data__email', 'data__phone_number', 'data__status', 'data__source', 'data__assigned'],
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
        this.loadCustomers();
    }

    // Lấy rule sắp xếp
    getSortRule(): any {
        if (!this.sortField || !this.sortOption) {
            return {};
        }
        return {
            field: this.sortField,
            option: this.sortOption,
        };
    }

    // Lấy payload hoàn chỉnh
    getPayload() {
        return {
            page_index: this.currentPage,
            page_size: this.pageSize,
            filter_rules: this.getFilterRules(),
            search_rule: this.getSearchRule(),
            sort_rule: this.getSortRule(),
        };
    }
    handleFilterSubmit(formData: any): void {
        this.selectedAssgnedByIds = formData.assigned_by
            ? formData.assigned_by
            : [];
        this.selectedDepartmentIds = formData.department || [];
        this.selectedStatusIds = formData.status || [];
        this.selectedProvinIds = formData.address_provinces_name || [];
        this.selectedDistrictsIds = formData.address_districts_name || [];
        this.selectedWardsIds = formData.address_wards_name || [];
        this.selectedCreateAtIds = formData.created_at || [];
        this.selectedUpdateAtIds = formData.updated_at || [];
        this.selectedSourceIds = formData.source_name
            ? formData.source_name
            : [];
        this.reloadCustomers();
    }

    getFilterRules(): any[] {
        const filter_rules: any[] = [];

        if (this.selectedStatusIds.length > 0) {
            filter_rules.push({
                field: 'data__status',
                option: 'in',
                value: this.selectedStatusIds,
            });
        }
        if (this.selectedAssgnedByIds.length > 0) {
            filter_rules.push({
                field: 'data__assigned_by',
                option: 'in',
                value: this.selectedAssgnedByIds,
            });
        }

        if (this.selectedDepartmentIds.length > 0) {
            filter_rules.push({
                field: 'data__department',
                option: 'in',
                value: this.selectedDepartmentIds,
            });
        }
        if (this.selectedProvinIds.length > 0) {
            filter_rules.push({
                field: 'data__address_provinces_name',
                option: 'in',
                value: this.selectedProvinIds,
            });
        }
        if (this.selectedDistrictsIds.length > 0) {
            filter_rules.push({
                field: 'data__address_districts_name',
                option: 'in',
                value: this.selectedDistrictsIds,
            });
        }
        if (this.selectedWardsIds.length > 0) {
            filter_rules.push({
                field: 'data__address_wards_name',
                option: 'in',
                value: this.selectedWardsIds,
            });
        }
        if (this.selectedCreateAtIds.length > 0) {
            filter_rules.push({
                field: 'created_at',
                option: 'range',
                value: this.selectedCreateAtIds,
            });
        }
        if (this.selectedUpdateAtIds.length > 0) {
            filter_rules.push({
                field: 'updated_at',
                option: 'range',
                value: this.selectedUpdateAtIds,
            });
        }
        if (this.selectedSourceIds.length > 0) {
            filter_rules.push({
                field: 'data__source_name',
                option: 'in',
                value: this.selectedSourceIds,
            });
        }

        return filter_rules;
    }

    // Phân trang
    selectPageSize(size: number) {
        this.pageSize = size;
        this.isDropdownOpen = false;
        this.selectedCustomerIds = [];
        this.reloadCustomers();
    }

    get pages(): (number | string)[] {
        const pages = [];
        const maxVisiblePages = 5; // Số trang tối đa cần hiển thị (bao gồm các dấu "..." khi cần thiết)

        // Luôn hiển thị trang đầu tiên và cuối cùng
        pages.push(1);

        if (this.getTotalPages() <= maxVisiblePages) {
            // Nếu tổng số trang nhỏ hơn hoặc bằng số trang tối đa, hiển thị tất cả các trang
            for (let i = 2; i <= this.getTotalPages(); i++) {
                pages.push(i);
            }
        } else {
            // Nếu tổng số trang lớn hơn số trang tối đa, xử lý dấu "..."
            if (this.currentPage <= 3) {
                // Nếu trang hiện tại nhỏ hơn hoặc bằng 3, hiển thị từ 1 đến maxVisiblePages
                for (let i = 2; i <= maxVisiblePages; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.getTotalPages());
            } else if (this.currentPage >= this.getTotalPages() - 2) {
                // Nếu trang hiện tại gần cuối, hiển thị từ totalPages - maxVisiblePages + 1 đến totalPages
                pages.push('...');
                for (
                    let i = this.getTotalPages() - maxVisiblePages + 1;
                    i <= this.getTotalPages();
                    i++
                ) {
                    pages.push(i);
                }
            } else {
                // Nếu trang hiện tại ở giữa, hiển thị dấu "..." trước và sau các trang lân cận
                pages.push('...');
                for (
                    let i = this.currentPage - 1;
                    i <= this.currentPage + 1;
                    i++
                ) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(this.getTotalPages());
            }
        }

        return pages;
    }

    getItemRangeText(): string {
        if (this.totalRecords === 0) return '0';

        const from = (this.currentPage - 1) * this.pageSize + 1;
        const to = Math.min(this.currentPage * this.pageSize, this.totalRecords);
        return `${from}-${to}`;
    }

    getTotalPages(): number {
        return Math.ceil(this.totalItems / this.pageSize);
    }

    isFirstPage(): boolean {
        return this.currentPage === 1;
    }

    isLastPage(): boolean {
        return this.currentPage === this.getTotalPages();
    }

    goToPage(page: number, event: Event): void {
        event.preventDefault();
        if (
            page !== this.currentPage &&
            page >= 1 &&
            page <= this.getTotalPages()
        ) {
            this.currentPage = page;
            this.selectedCustomerIds = [];
            this.loadCustomers();
        }
    }

    goToPreviousPage(event: Event): void {
        event.preventDefault();
        if (!this.isFirstPage()) {
            this.currentPage--;
            this.selectedCustomerIds = [];
            this.loadCustomers();
        }
    }

    goToNextPage(event: Event): void {
        event.preventDefault();
        if (!this.isLastPage()) {
            this.currentPage++;
            this.selectedCustomerIds = [];
            this.loadCustomers();
        }
    }

    getStatusLabelFromIsActive(status: number | null): string {
        if (status === 1) return 'Đang hoạt động';
        if (status === 2) return 'Không hoạt động';
        return 'Chờ chấp nhận';
    }

    // getStatusColorClasses(status: number | null): string {
    //   if (status === 1) return 'bg-green-100 text-green-600';
    //   if (status === 2) return 'bg-red-100 text-red-600';
    //   return 'bg-orange-100 text-orange-700';
    // }

    onIndividualCheckboxChange(isChecked: boolean, user: User): void {
        if (isChecked) {
            this.selectedCustomerIds.push(user.id);
        } else {
            this.selectedCustomerIds = this.selectedCustomerIds.filter(
                (id) => id !== user.id
            );
        }
        console.log(this.selectedCustomerIds); // Hiển thị danh sách id đã chọn
    }

    deleteSelected(): void {
        var config: FuseConfirmationConfig = {
            title: this._translocoService.translate('customer.dialog.title'),
            message: this._translocoService.translate(
                'customer.dialog.message',
                { count: this.selectedCustomerIds.length }
            ),
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'error',
            },
            actions: {
                confirm: {
                    show: true,
                    label: this._translocoService.translate(
                        'customer.dialog.confirm'
                    ),
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: this._translocoService.translate(
                        'customer.dialog.cancel'
                    ),
                },
            },
            dismissible: false,
        };

        const dialogRef = this._fuseConfirmationService.open(config);
        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._customerService
                    .deleteCustomers(this.selectedCustomerIds)
                    .subscribe({
                        next: () => {
                            this.loadCustomers();
                            this._alertService.showAlert({
                                title: this._translocoService.translate(
                                    'customer.success_title'
                                ),
                                message: this._translocoService.translate(
                                    'customer.success_message'
                                ),
                                type: 'success',
                            });
                            this.selectedCustomerIds = [];
                        },
                        error: (err) => {
                            console.error('Lỗi khi xóa:', err);
                            this._alertService.showAlert({
                                title: this._translocoService.translate(
                                    'customer.error_title'
                                ),
                                message: this._translocoService.translate(
                                    'customer.error_message'
                                ),
                                type: 'error',
                            });
                        },
                    });
            }
        });
        return;
    }

    onToggleSelectAll(): void {
        const selectableIds = this.userList.map((user) => user.id);
        const selectedCount = this.selectedCustomerIds.filter((id) =>
            selectableIds.includes(id)
        ).length;

        if (selectedCount === 0) {
            // Chưa chọn gì -> chọn tất cả
            this.selectedCustomerIds = [...selectableIds];
        } else {
            // Đang chọn một phần hoặc tất cả -> bỏ hết
            this.selectedCustomerIds = [];
        }
    }

    onStatusChange(customer: any) {
        // Tạo một bản sao đầy đủ của customer.data
        const updatedData = { ...customer.data };

        // Chỉ cập nhật status
        updatedData.status = customer.data.status;

        this._customerService
            .updateCustomer(customer.id, updatedData)
            .subscribe({
                next: (res) => {
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: 'Cập nhật thành công!',
                        type: 'success',
                    });
                },
                error: (err) => {
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: 'Cập nhật thất bại!',
                        type: 'error',
                    });
                },
            });
    }

    // Biến lưu giá trị nhập trang
    inputPage: number | null = null;

    // Hàm xử lý khi nhấn Enter trong input hoặc gọi thủ công
    jumpToPage() {
        if (this.inputPage == null) return;

        let page = Math.floor(this.inputPage);
        if (page < 1) page = 1;
        if (page > this.pages.length) page = this.pages.length;

        this.goToPage(page, event);
        this.inputPage = null; // reset input
    }

    // Hiển thị tooltip theo id
    getTooltipContent(userId: number): string {
        const user = this.userList.find((u) => u.id === userId);
        return user
            ? `Username: ${user.data.customer_name}\nEmail: ${user.data.email}\nSĐT: ${user.data.phone_number}`
            : 'Không tìm thấy user';
    }

    // Popup import file
    showImport = false;

    openImport() {
        this.showImport = true;
    }

    closeImport() {
        this.showImport = false;
    }
}
