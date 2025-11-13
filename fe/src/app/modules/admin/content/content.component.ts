import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContentService } from 'app/core/admin/content/content.service';
import { Content } from 'app/core/admin/content/content.types';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { AddContentComponent } from './add-content/add-content.component';
import { DeleteContentComponent } from './delete-content/delete-content.component';
import { UpdateContentComponent } from './update-content/update-content.component';
import { FilterContentComponent } from './filter-content/filter-content.component';
import { MatIconModule } from '@angular/material/icon';

import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';

import { AlertService } from 'app/core/alert/alert.service';


@Component({
    selector: 'app-content',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        AddContentComponent,
        DeleteContentComponent,
        UpdateContentComponent,
        MatIconModule,
        FilterContentComponent,
        TranslocoModule,
        CustomPaginationComponent,
    ],
    templateUrl: './content.component.html',
    styleUrls: ['./add-content/add-content.component.scss'],
})
export class ContentComponent implements OnInit {
    @ViewChild('filterToggleBtn', { read: ElementRef })
    filterToggleBtnRef!: ElementRef;
    @ViewChild('filterContainer', { read: ElementRef })
    filterContainerRef!: ElementRef;
    allContents: Content[] = [];
    contents: Content[] = [];
    selectedIdsToDelete: number[] = [];
    currentUser: User | null = null;
    justOpened = false;
    isLoading: boolean = false;
    sortField: string = '';
    sortDirection: 'asc' | 'desc' | null = null;
    filteredContents: Content[] = [];
    filterKeyWord: string = '';
    showFilter: boolean = false;
    showFilterModal = false;
    showInlineFilter = false;
    isFiltered = false;
    currentFilterRules: any[] = [];
    currentSearchRule: any = {
        fields: ['title', 'created_by', 'updated_by'],
        option: 'contains',
        value: '',
    };
    // Phân trang
    currentPage = 1;
    pageSize = 10;
    totalItems = 0;

    // Form thêm mới
    form = {
        title: '',
        content: '',
    };
    showAddForm = false;

    // Delete
    showDeleteForm = false;
    selectedIdToDelete: number | null = null;

    // Update
    showUpdateForm = false;
    selectedContentToUpdate: Content | null = null;

    // checkbox

    isAllSelected: boolean = false;
    constructor(
        private contentService: ContentService,
        private userService: UserService,
        private translocoService: TranslocoService,
        private _alertService: AlertService
    ) {}

    ngOnInit(): void {
        this.userService.user$.subscribe((user) => {
            this.currentUser = user;
        });
        this.loadContent();

        this.contentService.getTrainingStatusUpdates().subscribe({
            next: (event: any) => {
                // Ví dụ event có cấu trúc: { job_id, status, model, notes }
                let type: 'success' | 'error' | 'info' = 'success';
                let message = '';

                if (event.status === 'succeeded') {
                    type = 'success';
                    message = this.translocoService.translate(
                        'fine-tuning.TRAINING_SUCCEEDED'
                    );
                } else if (event.status === 'failed') {
                    type = 'error';
                    message = this.translocoService.translate(
                        'fine-tuning.TRAINING_FAILED'
                    );
                } else if (
                    event.status === 'validating_files' ||
                    event.status === 'running'
                ) {
                    type = 'info';
                    message = this.translocoService.translate(
                        'fine-tuning.TRAINING_RUNNING'
                    );
                } else {
                    type = 'info';
                    message = this.translocoService.translate(
                        'fine-tuning.TRAINING_NO_ACTIVE'
                    );
                }

                if (message) {
                    this._alertService.showAlert({
                        type,
                        title: this.translocoService.translate(
                            'fine-tuning.title'
                        ),
                        message,
                    });
                }
            },
            error: (err) => {
                this._alertService.showAlert({
                    type: 'error',
                    title: this.translocoService.translate('errors.default'),
                    message: this.translocoService.translate('errors.default'),
                });
            },
        });
    }

    loadContent(): void {
        this.isLoading = true;

        this.contentService.getContents().subscribe({
            next: (res) => {
                this.isLoading = false;

                this.allContents = res.result || [];
                this.totalItems = this.allContents.length;

                this.allContents.forEach((item) => (item.selected = false));

                this.filteredContents = [...this.allContents]; // Copy để filter
                this.currentPage = 1;
                this.applySort();
                this.updatePagedContent();
                this.updateSelectedIds();
                this.isAllSelected = false;
                this.contents.forEach((item) => (item.selected = false));
                this.selectedIdsToDelete = [];
            },
            error: (err) => {
                console.error('Lỗi khi tải content:', err);
                this.isLoading = false;
                this.allContents = [];
                this.filteredContents = [];
                this.contents = [];
                this.totalItems = 0;
            },
        });
    }

    // Thêm nội dung
    openAddForm(): void {
        this.showAddForm = true;
    }

    cancelAddForm(): void {
        this.showAddForm = false;
        this.resetForm();
    }

    createContent(): void {
        if (!this.form.title || !this.form.content) return;

        this.contentService.createContents(this.form).subscribe(() => {
            this.loadContent();
            this.resetForm();
            this.showAddForm = false;
        });
    }

    resetForm(): void {
        this.form = {
            title: '',
            content: '',
        };
    }

    // Xóa nội dung
    openDeleteForm(id: number): void {
        this.selectedIdToDelete = id;
        this.selectedIdsToDelete = []; // Reset danh sách checkbox để tránh nhầm lẫn
        this.showDeleteForm = true;
    }

    cancelDeleteForm(): void {
        this.showDeleteForm = false;
        this.selectedIdToDelete = null;
    }

    // Cập nhật nội dung
    openUpdateForm(content: Content): void {
        this.selectedContentToUpdate = content;
        this.showUpdateForm = true;
    }

    cancelUpdateForm(): void {
        this.showUpdateForm = false;
        this.selectedContentToUpdate = null;
    }

    // Phân trang
    hasNextPage(): boolean {
        return this.currentPage * this.pageSize < this.totalItems;
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.updatePagedContent();
    }
    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadContent();
    }
    getPageNumbers(): number[] {
        const totalPages = Math.ceil(this.totalItems / this.pageSize);
        const pages: number[] = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    updatePagedContent(): void {
        const pageSizeNumber = Number(this.pageSize);
        const start = (this.currentPage - 1) * pageSizeNumber;
        const end = start + pageSizeNumber;
        this.contents = this.filteredContents.slice(start, end);
    }

    // xử lí check box
    toggleSelectAll(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.isAllSelected = checked;

        this.contents.forEach((item) => {
            item.selected = checked;
            const index = this.allContents.findIndex((i) => i.id === item.id);
            if (index !== -1) {
                this.allContents[index].selected = checked;
            }
        });

        this.updateSelectedIds();
    }
    toggleItemSelection(item: Content, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        item.selected = checked;

        // Cập nhật trong allContents
        const index = this.allContents.findIndex((i) => i.id === item.id);
        if (index !== -1) {
            this.allContents[index].selected = checked;
        }

        // Cập nhật danh sách id đã chọn
        this.updateSelectedIds();

        // Cập nhật trạng thái isAllSelected dựa trên tất cả các item trong current page
        this.isAllSelected = this.contents.every((c) => c.selected);
    }
    updateSelectedIds(): void {
        this.selectedIdsToDelete = this.contents
            .filter((item) => item.selected)
            .map((item) => item.id);
    }
    deleteSelectedItems(): void {
        this.selectedIdsToDelete = this.contents
            .filter((item) => item.selected)
            .map((item) => item.id);

        if (this.selectedIdsToDelete.length > 0) {
            this.selectedIdToDelete = null;
            this.showDeleteForm = true;
        }
    }
    get hasSelectedItems(): boolean {
        return this.contents.some((c) => c.selected);
    }

    // xử lí search

    sortBy(field: string) {
        if (this.sortField === field) {
            if (this.sortDirection === 'asc') {
                this.sortDirection = 'desc';
            } else if (this.sortDirection === 'desc') {
                // Bấm lần 3: trở về trạng thái bình thường
                this.sortField = '';
                this.sortDirection = null;
            } else {
                this.sortDirection = 'asc';
            }
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.handleSort();
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent): void {
        const target = event.target as HTMLElement;

        const clickedInsideFilter =
            this.filterContainerRef?.nativeElement.contains(target);
        const clickedToggleBtn =
            this.filterToggleBtnRef?.nativeElement.contains(target);

        if (!clickedInsideFilter && !clickedToggleBtn && this.showFilter) {
            this.showFilter = false;
        }
    }

    applySort(): void {
        if (!this.sortField || !this.sortDirection) {
            this.updatePagedContent();
            return;
        }

        const field = this.getActualField(this.sortField);
        const direction = this.sortDirection;

        this.filteredContents.sort((a: any, b: any) => {
            let valueA = a[field];
            let valueB = b[field];

            const isDateField = ['createdAt', 'updateAt'].includes(field);

            if (isDateField) {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
                return direction === 'asc'
                    ? valueA.getTime() - valueB.getTime()
                    : valueB.getTime() - valueA.getTime();
            }

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return direction === 'asc' ? valueA - valueB : valueB - valueA;
            }

            return 0;
        });

        this.updatePagedContent();
    }
    getActualField(field: string): keyof Content {
        const map: Record<string, keyof Content> = {
            title: 'title',
            content: 'content',
            updatedBy: 'updated_by',
            createdBy: 'created_by',
            updateAt: 'update_at',
            createdAt: 'created_at',
        };
        return map[field] || (field as keyof Content);
    }

    handleAdvancedFilter(rawFilters: any): void {
        const filter_rules = [];

        if (rawFilters.created_by) {
            filter_rules.push({
                field: 'created_by',
                option: 'exact',
                value: Number(rawFilters.created_by),
            });
        }

        if (rawFilters.updated_by) {
            filter_rules.push({
                field: 'updated_by',
                option: 'exact',
                value: Number(rawFilters.updated_by),
            });
        }

        if (rawFilters.updated_at) {
            filter_rules.push({
                field: 'updated_at',
                option: 'exact',
                value: rawFilters.updated_at,
            });
        }

        const payload = {
            page_index: 1,
            page_size: this.pageSize,
            filter_rules,
        };
        this.currentFilterRules = payload.filter_rules;

        this.isLoading = true;
        this.contentService.filterContents(payload).subscribe({
            next: ({ result, total }) => {
                this.isLoading = false;
                this.contents = result || [];
                this.totalItems = total || 0;
                this.currentPage = 1;
                this.isFiltered = true;
            },
            error: (err) => {
                console.error('Lọc thất bại:', err);
                this.isLoading = false;
            },
        });
    }
    toggleFilter(): void {
        this.showFilter = !this.showFilter;
    }

    applyFilter(): void {
        const keyword = this.filterKeyWord.toLowerCase().trim();

        this.filteredContents = this.allContents.filter(
            (item) =>
                item.title?.toLowerCase().includes(keyword) ||
                item.content?.toLowerCase().includes(keyword) ||
                item.created_by?.toLowerCase().includes(keyword) ||
                item.updated_by?.toLowerCase().includes(keyword)
        );

        this.totalItems = this.filteredContents.length;
        this.currentPage = 1;
        this.applySort(); // nếu có sort
        this.updatePagedContent();
    }
    clearFilter(): void {
        this.isFiltered = false;
        this.loadContent();
    }
    buildFilterPayload(): any {
        return {
            page_index: this.currentPage,
            page_size: this.pageSize,
            filter_rules: [
                {
                    field: 'created_by',
                    option: 'exact',
                    value: this.currentUser?.id,
                },
                {
                    field: 'updated_by',
                    option: 'exact',
                    value: this.currentUser?.id,
                },
                { field: 'updated_at', option: 'exact', value: '2024-01-01' },
            ],
            
            sort_rule:
                this.sortField && this.sortDirection
                    ? {
                          field: this.getActualField(this.sortField),
                          direction: this.sortDirection,
                      }
                    : {
                          field: 'updated_at',
                          direction: 'desc',
                      },
        };
    }
    handleSort(): void {
        const payload = {
            page_index: this.currentPage, // Không reset page
            page_size: this.pageSize,
            filter_rules: this.currentFilterRules ?? [],
            
            sort_rule:
                this.sortField && this.sortDirection
                    ? {
                          field: this.getActualField(this.sortField),
                          direction: this.sortDirection,
                      }
                    : {
                          field: 'updated_at',
                          direction: 'desc',
                      },
        };

        this.isLoading = true;
        this.contentService.filterContents(payload).subscribe({
            next: ({ result, total }) => {
                this.isLoading = false;
                this.contents = result || [];
                this.totalItems = total || this.contents.length;
            },
            error: (err) => {
                console.error('Sort thất bại:', err);
                this.isLoading = false;
            },
        });
        console.log('Total items:', this.totalItems);
        console.log('Total pages:', Math.ceil(this.totalItems / this.pageSize));
        console.log('Current page:', this.currentPage);
    }
    // checkbox
    onDeleteRefresh(): void {
        this.isAllSelected = false;
        this.contents.forEach((item) => (item.selected = false));
        this.selectedIdsToDelete = [];
        this.loadContent();
        this.isAllSelected = false;
    }

    onItemSelectionChange(): void {
        this.isAllSelected = this.contents.every((item) => item.selected);
        this.updateSelectedIds();
    }

    startTraining(): void {
        this.contentService.startTraining().subscribe({
            next: (event) => {
                console.log('Training started:', event);

                this._alertService.showAlert({
                    type: 'success',
                    title: this.translocoService.translate(
                        'other.success_title'
                    ),
                    message: this.translocoService.translate(
                        'fine-tuning.TRAINING_STARTED'
                    ),
                });
            },
            error: (err) => {
                this._alertService.showAlert({
                    type: 'error',
                    title: this.translocoService.translate('other.error_title'),
                    message:
                        err?.error?.error ||
                        this.translocoService.translate(
                            'fine-tuning.errors.training_start_failed'
                        ),
                });
            },
        });
    }
}
