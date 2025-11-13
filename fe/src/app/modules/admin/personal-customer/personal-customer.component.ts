import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { debounceTime, Subject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from 'app/core/alert/alert.service';
import { Router } from '@angular/router';
import { routeConfig } from 'app/core/uri/config.route';
import { CustomFormTemplateService } from 'app/core/admin/custom-form-template/custom-form-template.service';
import { FormTemplate } from 'app/core/admin/custom-form-template/custom-form-template.types';
import { AddFormComponent } from './add-form/add-form.component';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';

@Component({
    selector: 'app-personal-customer-management',
    standalone: true,
    imports: [SharedModule, CommonModule, CdkScrollable, MatTooltipModule, AddFormComponent, CustomPaginationComponent],
    templateUrl: './personal-customer.component.html',
    styles: ``,
})
export class PersonalCustomerComponent {
    // Trạng thái tải dữ liệu
    isLoading: boolean = false;

    // Dữ liệu
    formTemplates: FormTemplate[] = [];
    templateTypes = [
        { value: 'default', name: 'Mặc định' },
        { value: 'custom', name: 'Tùy chỉnh' }
    ];

    // Tìm kiếm
    searchValue: string = '';
    searchInputChanged: Subject<string> = new Subject<string>();

    // Filter các giá trị
    selectedTypeValue: string[] = [];

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // Phân trang
    totalRecords: number = 0;
    totalItems: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;

    // Chọn formTemplate
    selectedFormIds: number[] = [];

    showAddFormPopup = false;

    constructor(
        private _customFormTemplateService: CustomFormTemplateService,
        private _alertService: AlertService,
        private _router: Router,
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.searchInputChanged
            .pipe(debounceTime(500))
            .subscribe(() => this.reloadForms());
    }

    // Tải dữ liệu
    loadData(): void {
        this.loadForms();
    }

    loadForms(): void {
        this.isLoading = true;
        this.deleteSelected();
        const payload = this.getPayload();

        this._customFormTemplateService.getForms(payload).subscribe({
            next: (response: any) => {
                this._customFormTemplateService.forms$.subscribe((forms) => {
                    this.formTemplates = forms;
                });
                this.totalRecords = response.data.all_tables;
                this.totalItems = response.data.total_tables;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                console.error('API Error:', err);
            },
        });
    }

    reloadForms(): void {
        this.currentPage = 1; // Reset lại về trang đầu
        this.loadForms();
    }

    onSearchChange(): void {
        this.searchInputChanged.next(this.searchValue);
    }

    // Lấy các rule tìm kiếm
    getSearchRule(): any {
        const defaultSearchFields = {
            fields: ['name'],
            option: 'contains',
            value: this.searchValue.trim(),
        };

        return this.searchValue?.trim() ? defaultSearchFields : {};
    }

    // Lấy các filter rules
    getFilterRules(): any[] {
        const filter_rules: any[] = [];

        filter_rules.push({
            field: 'type',
            option: 'in',
            value: ['Customer'],
        });

        return filter_rules;
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
        this.loadForms();
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

    getTemplateTypeName(value: string): string {
        return this.templateTypes.find(t => t.value === value)?.name || '';
    }

    openAddForm() {
        this.showAddFormPopup = true;
    }

    closeAddForm(): void {
        this.showAddFormPopup = false;
    }

    navigateToEditFormTemplate(user: any) {
        this._router.navigateByUrl(`${routeConfig.ROUTER_ADMIN}/edit-form-template/${user.id}`);
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadForms();
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.reloadForms();
    }

    onIndividualCheckboxChange(isChecked: boolean, form: FormTemplate): void {
        if (isChecked) {
            this.selectedFormIds.push(form.id);
        }
        else {
            this.selectedFormIds = this.selectedFormIds.filter((id) => id !== form.id);
        }
    }

    onToggleSelectAll(): void {
        const selectableIds = this.formTemplates.map((user) => user.id);
        const selectedCount = this.selectedFormIds.filter((id) => selectableIds.includes(id)).length;

        if (selectedCount === 0) {
            // Chưa chọn gì -> chọn tất cả
            this.selectedFormIds = [...selectableIds];
        } else {
            // Đang chọn một phần hoặc tất cả -> bỏ hết
            this.selectedFormIds = [];
        }
    }

    deleteSelected(): void {
        this.selectedFormIds = [];
    }
}