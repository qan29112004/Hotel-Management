import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { RouterModule } from '@angular/router';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
@Component({
    selector: 'app-news-category',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        AngularEditorModule,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './news-category.component.html',
    styles: ``
})
export class NewsCategoryComponent implements OnInit {
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    selectedCategoryId: number | null = null;

    showAddCategoryPopup = false;
    showUpdateCategoryPopup = false;
    showAddChildCategoryPopup = false;
    showDeletePopup = false;
    showDeleteAllPopup = false;

    newCategory: { name: string; slug: string; category_parent: number } = { name: '', slug: '', category_parent: null };
    errorFields: { [key: string]: string } = {};

    checkboxSelected: any[] = [];

    //tìm kiếm
    isSearching: boolean = false;
    searchText: string = '';

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    currentPage: number = 1;
    pageSize: number = 10;
    totalNewsCategory: number = 0;
    totalPages: number = 0;

    constructor(
        private _newsCategoryService: NewsCategoryService,
        private _alertService: AlertService,
        public translocoService: TranslocoService
    ) { }

    ngOnInit() {
        this.loadNewsCategories();
    }

    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
        };
        if (this.searchText) {
            payload.searchRule = {
                fields: ['name'],
                option: 'contains',
                value: this.searchText
            }
        }
        if (this.sortField) {
            payload.sortRule = {
                field: this.sortField,
                option: this.sortOption
            };
        }
        return payload;
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
        this.loadNewsCategories();
    }
    onPageChange(page: number) {
        this.currentPage = page;
        this.loadNewsCategories();
        this.checkboxSelected = [];
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadNewsCategories();
        this.checkboxSelected = [];
    }

    loadNewsCategories() {
        const payload = this.getPayload();
        this._newsCategoryService.getNewsCategories(payload).subscribe(([categories_parent, totalNewsCategory]) => {
            // Thêm thuộc tính selected và expanded cho từng object
            this.categories_parent = categories_parent.map(cat => ({
                ...cat,
                selected: false,
                expanded: false
            }));
            
            this.categories_child = [];
                this.categories = [];
                for (const cat of this.categories_parent) {
                    const childrenWithParent = cat.children.map((child) => ({
                        ...child,
                        categoryParent: cat.id,
                    }));
                    this.categories_child =
                        this.categories_child.concat(childrenWithParent);
                    this.categories.push(cat);
                    this.categories =
                        this.categories.concat(childrenWithParent);
                }
            this.totalNewsCategory = totalNewsCategory;
            this.totalPages = Math.ceil(this.totalNewsCategory / this.pageSize);
        });
        this.checkboxSelected = [];
    }

    toggleSearch(event: Event): void {
        event.stopPropagation();
        this.isSearching = !this.isSearching;
    }

    clearSearch(): void {
        this.searchText = '';
        this.onSearchChange(); // Gọi lại hàm lọc nếu cần
      }
    
    onSearchChange() {
        this.currentPage = 1;
        this.loadNewsCategories();
    }

    toggleExpand(cat: any) {
        cat.expanded = !cat.expanded;
    }

    getChildCategories(id: number): any[] {
        for (const cat of this.categories_parent) {
            if (cat.id === id) {
                return cat.children;
            }
        }
        return [];
    }

    clearFieldError(field: string): void {
        if (this.errorFields[field]) {
            delete this.errorFields[field];
        }
    }

    openAddCategoryPopup() {
        this.showAddCategoryPopup = true;
    }

    closeAddCategoryPopup() {
        this.showAddCategoryPopup = false;
        this.newCategory = { name: '', slug: '', category_parent: null }; // Reset form
        this.errorFields = {};
    }

    createCategory(): void {
        this.errorFields = {};
        if (this.newCategory.name && this.newCategory.name.length > 100) {
            this.errorFields['name'] = 'Vui lòng nhập tối đa 100 ký tự';
            return;
        }
        this._newsCategoryService.createNewsCategory(this.newCategory).subscribe({
            next: () => {
                this.closeAddCategoryPopup();
                this._newsCategoryService.getNewsCategories(this.getPayload()).subscribe(([categories_parent, totalNewsCategory]) => {
                    this.categories_parent = categories_parent;
                    for (const cat of this.categories_parent) {
                        this.categories_child = this.categories_child.concat(cat.children);
                    }
                    this.totalNewsCategory = totalNewsCategory;
                    this.totalPages = Math.ceil(this.totalNewsCategory / this.pageSize);
                });
                this.loadNewsCategories();
                this._alertService.showAlert({
                    title: this.translocoService.translate('news_category.success_title'),
                    message: this.translocoService.translate('news_category.success_create_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                console.error('Create category error:', err);
                if (err?.error?.code === 'VALIDATION_ERROR' && Array.isArray(err.error.errors)) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        let code = field;
                        
                        if (field === 'name') {
                            if (msg.includes('already exists')) {
                                code = 'name_exists';
                            }
                        } else if (field === 'slug') {
                            if (msg.includes('already exists')) {
                                code = 'slug_exists';
                            }
                        } else if (field === 'category_parent') {
                            if (msg.includes('2 levels')) {
                                code = 'category_parent_level';
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

    isChildCategory(slug: string): boolean {
        return this.categories_child.some(cat => cat.slug === slug);
    }

    openUpdatePopup(category: any) {
        if (!category) {
            this._alertService.showAlert({
                title: this.translocoService.translate('news_category.error_title'),
                message: this.translocoService.translate('news_category.error_select_category'),
                type: 'error'
            });
            return;
        }
        this.selectedCategoryId = category.id;
        this.newCategory = {
            name: category.name,
            slug: category.slug,
            category_parent: category.categoryParent
        };
        this.showUpdateCategoryPopup = true;
    }

    closeUpdateCategoryPopup() {
        this.showUpdateCategoryPopup = false;
        this.selectedCategoryId = null;
        this.newCategory = { name: '', slug: '', category_parent: null };
        this.errorFields = {};
    }

    submitUpdateCategory(): void {
        if (!this.selectedCategoryId) return;
        this.errorFields = {};
        if (this.newCategory.name && this.newCategory.name.length > 100) {
            this.errorFields['name'] = 'Vui lòng nhập tối đa 100 ký tự';
            return;
        }
        this._newsCategoryService.updateNewsCategory(this.selectedCategoryId, this.newCategory).subscribe({
            next: () => {
                this.closeUpdateCategoryPopup();
                this._newsCategoryService.getNewsCategories(this.getPayload()).subscribe(([categories_parent, totalNewsCategory]) => {
                    this.categories_parent = categories_parent;
                    for (const cat of this.categories_parent) {
                        this.categories_child = this.categories_child.concat(cat.children);
                    }
                    this.totalNewsCategory = totalNewsCategory;
                    this.totalPages = Math.ceil(this.totalNewsCategory / this.pageSize);
                });
                this.loadNewsCategories();
                this._alertService.showAlert({
                    title: this.translocoService.translate('news_category.success_title'),
                    message: this.translocoService.translate('news_category.success_update_message'),
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
                        
                        if (field === 'name') {
                            if (msg.includes('already exists')) {
                                code = 'name_exists';
                            }
                        } else if (field === 'slug') {
                            if (msg.includes('already exists')) {
                                code = 'slug_exists';
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

    openAddChildCategoryPopup(category: any) {
        this.showAddChildCategoryPopup = true;
        this.newCategory.category_parent = category.id;
        this.selectedCategoryId = category.id;
    }

    closeAddChildCategoryPopup() {
        this.showAddChildCategoryPopup = false;
        this.newCategory = { name: '', slug: '', category_parent: null };
        this.errorFields = {};
    }

    createChildCategory(): void {
        this.errorFields = {};
        this._newsCategoryService.createNewsCategory(this.newCategory).subscribe({
            next: () => {
                this.closeAddChildCategoryPopup();
                this._newsCategoryService.getNewsCategories(this.getPayload()).subscribe(([categories_parent, totalNewsCategory]) => {
                    this.categories_parent = categories_parent;
                    for (const cat of this.categories_parent) {
                        this.categories_child = this.categories_child.concat(cat.children);
                    }
                });
                this.loadNewsCategories();
                this._alertService.showAlert({
                    title: this.translocoService.translate('news_category.success_title'),
                    message: this.translocoService.translate('news_category.success_create_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                console.error('Create child category error:', err);
                if (err?.error?.code === 'VALIDATION_ERROR' && Array.isArray(err.error.errors)) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        let code = field;
                        
                        if (field === 'name') {
                            if (msg.includes('already exists')) {
                                code = 'name_exists';
                            }
                        } else if (field === 'slug') {
                            if (msg.includes('already exists')) {
                                code = 'slug_exists';
                            }
                        } else if (field === 'category_parent') {
                            if (msg.includes('2 levels')) {
                                code = 'category_parent_level';
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

    openDeletePopup(category: any) {
        this.showDeletePopup = true;
        this.selectedCategoryId = category.id;
    }

    closeDeletePopup() {
        this.showDeletePopup = false;
        this.selectedCategoryId = null;
    }

    deleteCategory() {
        if (!this.selectedCategoryId) return;
        this._newsCategoryService.deleteNewsCategory(this.selectedCategoryId).subscribe({
            next: () => {
                this.closeDeletePopup();
                this._newsCategoryService.getNewsCategories(this.getPayload()).subscribe(([categories_parent, totalNewsCategory]) => {
                    this.categories_parent = categories_parent;
                    for (const cat of this.categories_parent) {
                        this.categories_child = this.categories_child.concat(cat.children);
                    }
                    this.totalNewsCategory = totalNewsCategory;
                    this.totalPages = Math.ceil(this.totalNewsCategory / this.pageSize);
                });
                this.loadNewsCategories();
                this._alertService.showAlert({
                    title: this.translocoService.translate('news_category.success_title'),
                    message: this.translocoService.translate('news_category.success_delete_message'),
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
        if (this.categories_parent.length === 0) return false;
        return this.checkboxSelected.length === this.categories_parent.length;
    }

    onCheckboxChangeAll(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
        if (isChecked) {
            this.checkboxSelected = this.categories_parent;
            this.categories_parent.forEach(cat => {
                cat.selected = true;
            });
            // console.log('checkboxSelected', this.checkboxSelected);
        } else {
            this.checkboxSelected = [];
            this.categories.forEach(cat => {
                cat.selected = false;
            });
            // console.log('checkboxSelected', this.checkboxSelected);
        }
    }

    openDeleteAllPopup() {
        this.showDeleteAllPopup = true;
    }

    closeDeleteAllPopup() {
        this.showDeleteAllPopup = false;
    }

    deleteAllCategories() {
        this.checkboxSelected.forEach(category => {
            this._newsCategoryService.deleteNewsCategory(category.id).subscribe({
                next: () => {
                    this.closeDeleteAllPopup();
                    this._newsCategoryService.getNewsCategories(this.getPayload()).subscribe(([categories_parent, totalNewsCategory]) => {
                        this.categories_parent = categories_parent;
                        for (const cat of this.categories_parent) {
                            this.categories_child = this.categories_child.concat(cat.children);
                        }
                        this.totalNewsCategory = totalNewsCategory;
                        this.totalPages = Math.ceil(this.totalNewsCategory / this.pageSize);
                    });
                    this.loadNewsCategories();
                    this._alertService.showAlert({
                        title: this.translocoService.translate('news_category.success_title'),
                        message: this.translocoService.translate('news_category.success_delete_message'),
                        type: 'success'
                    });
                },
                error: (err) => {
                    console.error('Delete all categories error:', err);
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('errors.default'),
                        type: 'error'
                    });
                }
            });
        });
    }

    onCheckboxChange(event: Event, category: any) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
        if (isChecked) {
            this.checkboxSelected.push(category);
            console.log('checkboxSelected', this.checkboxSelected);
        } else {
            this.checkboxSelected = this.checkboxSelected.filter(cat => cat.id !== category.id);
            console.log('checkboxSelected', this.checkboxSelected);
        }
    }
}