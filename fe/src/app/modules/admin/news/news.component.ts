import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';
import { HttpClient } from '@angular/common/http';
import { CreateNewsRequest, NewsService } from 'app/core/admin/news/news.service';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import {
    AngularEditorModule,
    AngularEditorConfig,
} from '@kolkov/angular-editor';
import { News } from 'app/core/admin/news/news.types';
import { RouterModule } from '@angular/router';
import { uriConfig } from 'app/core/uri/config';
import { UserService } from 'app/core/profile/user/user.service';

@Component({
    selector: 'app-news',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        AngularEditorModule,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './news.component.html',
    styles: ``,
})
export class NewsComponent implements OnInit {
    @ViewChild('filterToggleBtn', { read: ElementRef }) filterToggleBtnRef!: ElementRef;
    @ViewChild('filterContainer', { read: ElementRef }) filterContainerRef!: ElementRef;
    @ViewChild('categoryList') categoryList: ElementRef;
    @ViewChild('editor') editorComp: any;
    @ViewChild('categoryDropdown', { static: false }) categoryDropdownRef!: ElementRef;
    @ViewChild('statusDropdown', { static: false }) statusDropdownRef!: ElementRef;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    users: any[] = [];
    news: any[] = [];
    likedUsers: any[] = [];
    openDropdowns = new Set<string>();
    newsDetail: News | null = null;
    textOnlyContent: string = '';
    imageUrls: string[] = [];
    selectedCatIds: number[] = [];

    // status
    statusOptions = this._newsService.getStatus();

    //tìm kiếm
    isSearching: boolean = false;
    searchText: string = '';
    // Phân trang
    currentPage: number = 1;
    pageSize: number = 10;
    totalNews: number = 0;
    totalPages: number = 0;

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // filter
    selectedCategoryIds: number[] = [];
    showCategoryDropdown: boolean = false;
    isFilter = false;
    selectedCreatedBy: number | null = null;
    selectedUpdatedBy: number | null = null;
    showStatusDropdown = false;
    selectedStatus: number[] = [];
    startDate: string = '';
    endDate: string = '';
    selectedCreatedAt: string[] = [];
    updatedStartDate: string = '';
    updatedEndDate: string = '';
    selectedUpdatedAt: string[] = [];

    // popup
    showDeleteAllPopup: boolean = false;
    showDeletePopup: boolean = false;
    checkboxSelected: any[] = [];
    showLikedUsersPopup: boolean = false;
    showFilterPopup: boolean = false;
    showDetailPopup: boolean = false;
    showEditNewsPopup: boolean = false;
    showApprovePopup: boolean = false;

    // Image loading states
    isImageLoading: boolean = false;
    imageError: boolean = false;

    //error hiển thị lỗi
    errorFields: { [key: string]: string } = {};

    newPost: Partial<News> & { categories?: number[] } = {
        slug: '',
        content: '',
        images: [],
        attachments: [],
        categories: undefined,
    };


    handleImageLoad(event: Event) {
        this.isImageLoading = false;
        this.imageError = false;
    }

    handleImageError(event: Event) {
        this.isImageLoading = false;
        this.imageError = true;
    }


    constructor(
        private _newsCategoryService: NewsCategoryService,
        private _newsService: NewsService,
        private _alertService: AlertService,
        public translocoService: TranslocoService,
        private _userService: UserService
    ) {}

    ngOnInit() {
        this._userService.getAllUser().subscribe(users => {
            this.users = users;
        });
        this.loadNewsCategory();
        this.loadNews();
    }

    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
    
        if (this.showCategoryDropdown) {
            if (
                this.categoryDropdownRef &&
                !this.categoryDropdownRef.nativeElement.contains(target)
            ) {
                this.showCategoryDropdown = false;
            }
        }

        if (this.showStatusDropdown) {
            if (
                this.statusDropdownRef &&
                !this.statusDropdownRef.nativeElement.contains(target)
            ) {
                this.showStatusDropdown = false;
            }
        }

        const clickedInsideFilter =
            this.filterContainerRef?.nativeElement.contains(target);
        const clickedToggleBtn =
            this.filterToggleBtnRef?.nativeElement.contains(target);

        if (!clickedInsideFilter && !clickedToggleBtn && this.showFilterPopup) {
            this.showFilterPopup = false;
        }
    }
    

    loadNewsCategory() {
        const payload: any = {
            pageIndex: 1,
            pageSize: 1000,
        };
        this._newsCategoryService
            .getNewsCategories(payload)
            .subscribe(([categories_parent, totalNewsCategory]) => {
                // Thêm thuộc tính selected và expanded cho từng object
                this.categories_parent = categories_parent.map((cat) => ({
                    ...cat,
                    selected: false,
                    expanded: false,
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
            });
    }

    toggleSearch(event: Event): void {
        event.stopPropagation();
        this.isSearching = !this.isSearching;
    }

    onSearchChange() {
        this.currentPage = 1;
        // console.log('this.searchText', this.searchText);
        this.loadNews();
    }

    getStatus(statusId: number, key: string): string {
        const status = this.statusOptions.find((s) => s.id === statusId);
        if (!status) return '';
        return key === 'name' ? status.name : status.class;
    }

    toggleDropdown(userId: string): void {
        if (this.openDropdowns.has(userId)) {
            this.openDropdowns.delete(userId);
        } else {
            this.openDropdowns.clear();
            this.openDropdowns.add(userId);
        }
    }

    isDropdownOpen(userId: string): boolean {
        return this.openDropdowns.has(userId);
    }

    closeDropdown(userId: string): void {
        this.openDropdowns.delete(userId);
    }

    changeStatus(news: any, newStatusId: number): void {
        if (news.status !== newStatusId) {
            this._newsService.updateNews(news.id, { status: newStatusId }).subscribe({
                next: (res) => {
                    this.loadNews();
                    this._alertService.showAlert({
                        title: 'Thành công',
                        message: 'Cập nhật trạng thái thành công',
                        type: 'success'
                    });
                },
            });
            news.status = newStatusId; // Cập nhật local luôn nếu muốn
        }
        this.checkboxSelected = [];
        this.closeDropdown(news.id);
    }

    loadNews() {
        const payload = this.getPayload();
        // console.log('payload', payload);
        this._newsService.getAllNews(payload).subscribe(([news, totalNews]) => {
            // Xử lý news ở đây
            this.news = news;
            this.totalNews = totalNews;
            this.totalPages = Math.ceil(this.totalNews / this.pageSize);
            // this.updatePagedNews();
        });
    }

    loadNewsDetail(slug: string) {
        this._newsService.getNewsBySlug(slug).subscribe(
            (news) => {
                this.newsDetail = news;
            },
            (error) => {
                console.error('Error loading news:', error);
            }
        );
    }


    opendNewDetailPopup(news: News) {
        // console.log(news)
        this.loadNewsDetail(news.slug);
        this.showDetailPopup = true;
    }

    get content(): string {
        return this.newsDetail?.content?.replace(/^\s+|\s+$/g, '') ?? '';
      }
      
    closeDetailPopup() {
        this.newsDetail = null;
        this.showDetailPopup = false;
    }

    openLikedUsersPopup(news: any) {
        // likedBy dạng { user: [...], total: n }
        this.likedUsers = Array.isArray(news.likedBy?.user) ? news.likedBy.user : [];
        console.log(news.likedBy)
        console.log(this.likedUsers)
        this.showLikedUsersPopup = true;
    }
    
    closeLikedUsersPopup() {
        this.showLikedUsersPopup = false;
        this.likedUsers = [];
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadNews();
        this.checkboxSelected = [];
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.currentPage = 1;
        this.loadNews();
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
        this.loadNews();
    }

    clearSearch(): void {
        this.searchText = '';
        this.onSearchChange(); // Gọi lại hàm lọc nếu cần
      }

    clearFilter() {
        this.selectedCategoryIds = [];
        this.selectedCreatedBy = null;
        this.selectedUpdatedBy = null;
        this.selectedStatus = [];
        this.startDate = null;
        this.endDate = null;
        this.selectedCreatedAt = [];
        this.updatedStartDate = null;
        this.updatedEndDate = null;
        this.selectedUpdatedAt = [];
        this.isFilter = false;
        this.loadNews();
    }

    onCategoryFilterChange(catId: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedCategoryIds.includes(catId)) {
                this.selectedCategoryIds.push(catId);
            }
        } else {
            this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== catId);
        }
    }

    get selectedCategories() {
        return this.categories.filter(cat => this.selectedCategoryIds.includes(cat.id));
    }

    get selectedCat() {
        return this.categories.filter(cat => this.selectedCatIds.includes(cat.id));
    }

    removeCategory(catId: number): void {
        this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== catId);
    }

    removeCat(catId: number): void {
        this.selectedCatIds = this.selectedCatIds.filter(id => id !== catId);
        // this.newNews.categories = this.selectedCategoryIds;

    }

    removeCategoryFilter() {
        this.selectedCategoryIds = [];
        this.updateFilterState();
        this.loadNews();
    }

    removeCreatedAtFilter() {
        this.startDate = null;
        this.endDate = null;
        this.selectedCreatedAt = [];
        this.updateFilterState();
        this.loadNews()
    }

    removeUpdatedAtFilter() {
        this.updatedStartDate = null;
        this,this.updatedEndDate = null;
        this.selectedUpdatedAt = [];
        this.updateFilterState();
        this.loadNews();
    }

    onStatusFilterChange(statusId: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedStatus.includes(statusId)) {
                this.selectedStatus.push(statusId);
            }
        } else {
            this.selectedStatus = this.selectedStatus.filter(id => id !== statusId);
        }
    }

    hasFilters(): boolean {
        return (
            this.selectedCategoryIds.length > 0 || 
            this.selectedCreatedBy !== null || 
            this.selectedUpdatedBy !== null ||
            this.selectedStatus.length > 0 ||
            this.selectedCreatedAt.length > 0 ||
            this.selectedUpdatedAt.length > 0
        );
    }

    updateFilterState() {
        this.isFilter = this.hasFilters();
    }
      

    removeStatusFilter() {
        this.selectedStatus = [];
        this.updateFilterState();
        this.loadNews();
    }

    removeCreatedByFilter() {
        this.selectedCreatedBy = null;
        this.updateFilterState();
        this.loadNews();
    }

    removeUpdatedByFilter() {
        this.selectedUpdatedBy = null;
        this.updateFilterState();
        this.loadNews();
    }

    openFilterPopup() {
        this.showFilterPopup = true;
    }

    closeFilterPopup() {
        this.showFilterPopup = false;
    }
    
    // Hàm áp dụng bộ lọc (có thể gọi loadNews hoặc logic filter của bạn)
    applyFilter() {
        this.showFilterPopup = false;
        this.isFilter = true;
        this.loadNews(); // Gọi lại hàm lấy dữ liệu với điều kiện lọc mới
    }

    // Lấy payload hoàn chỉnh
    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            filterRules: []
        };
        if (this.searchText) {
            payload.searchRule = {
                fields: ['content'],
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
        // lọc theo category
        if (this.selectedCategoryIds.length > 0) {
            payload.filterRules.push({
                field: 'categories',
                option: 'in',
                value: this.selectedCategoryIds
            });
        }

        // Lọc theo người tạo
        if (this.selectedCreatedBy) {
            payload.filterRules.push({
                field: 'created_by',
                option: 'exact',
                value: this.selectedCreatedBy
            });
        }
        // lọc theo người cập nhật
        if (this.selectedUpdatedBy) {
            payload.filterRules.push({
                field: 'updated_by',
                option: 'exact',
                value: this.selectedUpdatedBy
            })
        }
        // lọc theo status
        if (this.selectedStatus.length > 0) {
            payload.filterRules.push({
                field: 'status',
                option: 'in',
                value: this.selectedStatus
            });
        }
        // lọc theo ngày tạo
        if (this.startDate && this.endDate) {
            this.selectedCreatedAt = [this.startDate, this.endDate];
            payload.filterRules.push({
              field: 'created_at',
              option: 'range',
              value: this.selectedCreatedAt,
            });
        }
        // lọc theo ngày cập nhật
        if (this.updatedStartDate && this.updatedEndDate) {
            this.selectedUpdatedAt = [this.updatedStartDate, this.updatedEndDate];
            payload.filterRules.push({
                field: 'updated_at',
                option: 'range',
                value: this.selectedUpdatedAt,
            });
        }
        return payload;
    }

    isAllSelected(): boolean {
        if (this.news.length === 0) return false;
        return this.checkboxSelected.length === this.news.length;
    }

    onCheckboxChangeAll(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
        if (isChecked) {
            this.checkboxSelected = this.news;
            this.news.forEach((news) => {
                news.selected = true;
            });
        } else {
            this.checkboxSelected = [];
            this.news.forEach((news) => {
                news.selected = false;
            });
        }
    }

    openDeletePopup(news: News) {
        this.showDeletePopup = true;
        this.newPost = news
    }

    closeDeletePopup() {
        this.showDeletePopup = false;
    }

    deleteNews(news: News) {
        this._newsService.deleteNews(news.id).subscribe(() => {
            this.closeDeletePopup();
            this.loadNews();
            this._alertService.showAlert({
                title: this.translocoService.translate(
                    'news.success_title'
                ),
                message: this.translocoService.translate(
                    'news.success_delete_message'
                ),
                type: 'success',
            });
        });
    }

    openDeleteAllPopup() {
        this.showDeleteAllPopup = true;
    }

    closeDeleteAllPopup() {
        this.showDeleteAllPopup = false;
    }

    deleteAllNews() {
        this.checkboxSelected.forEach((news) => {
            this._newsService.deleteNews(news.id).subscribe(() => {
                this.closeDeleteAllPopup();
                this.checkboxSelected = [];
                this.loadNews();
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'news.success_title'
                    ),
                    message: this.translocoService.translate(
                        'news.success_delete_message'
                    ),
                    type: 'success',
                });
            });
        });
    }

    onCheckboxChange(event: Event, news: any) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
        if (isChecked) {
            this.checkboxSelected.push(news);
            console.log('checkboxSelected', this.checkboxSelected);
        } else {
            this.checkboxSelected = this.checkboxSelected.filter(
                (n) => n.id !== news.id
            );
            console.log('checkboxSelected', this.checkboxSelected);
        }
    }

    getCategoryName(catId: number): string {
        const cat = this.categories.find(c => c.id === catId);
        return cat ? cat.name : '';
    }

    openEditNewsPopup(news: News) {
        this.showDetailPopup = false;
        this.newPost = { ...news };
        // console.log('newPost', this.newPost);
        this.selectedCatIds = this.newPost.categories?.map((c: any) => c.id) || [];
        this.showEditNewsPopup = true;
    }

    closeEditNewsPopup() {
        this.showEditNewsPopup = false;
        this.newPost = {
            slug: '',
            content: '',
            images: [],
            attachments: [],
            categories: [],
        };
        this.selectedCatIds = [];
        this.errorFields = {};
    }

    onCategorySelect(catId: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedCatIds.includes(catId)) {
                this.selectedCatIds.push(catId);
            }
        } else {
            this.selectedCatIds = this.selectedCatIds.filter(id => id !== catId);
        }
        this.newPost.categories = this.selectedCatIds
    }

    onImageChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            try {
                // Kiểm tra định dạng file
                if (!file.type.startsWith('image/')) {
                    this._alertService.showAlert({
                        title: this.translocoService.translate(
                            'other.error_title'
                        ),
                        message: this.translocoService.translate(
                            'news.error_image_format'
                        ),
                        type: 'error',
                    });
                    return;
                }

                const formData = new FormData();
                formData.append('image', file);

                // Gửi API upload ảnh
                this._newsService.uploadImage(formData).subscribe({
                    next: (res) => {
                        if (res?.data?.url) {
                            this.newPost.images.push({
                                "image": res.data.url
                            });
                        }
                    },
                    error: (error) => {
                        console.error('Upload error:', error);
                        this._alertService.showAlert({
                            title: this.translocoService.translate(
                                'other.error_title'
                            ),
                            message: this.translocoService.translate(
                                'news.error_image_upload'
                            ),
                            type: 'error',
                        });
                    },
                });
            } catch (error) {
                console.error('Upload error:', error);
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate(
                        'news.error_image_upload'
                    ),
                    type: 'error',
                });
            }
        }
    }

    removeImage(index: number): void {
        this.newPost.images.splice(index, 1);
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files = Array.from(input.files);
            files.forEach(file => {
                const formData = new FormData();
                formData.append('file', file);

                this._newsService.uploadFile(formData).subscribe({
                    next: (res: any) => {
                        this.newPost.attachments?.push({
                            file: res.data.url,
                            filename: file.name,
                        });
                    },
                    error: err => {
                        console.error('Upload file lỗi:', err);
                    }
                });
            });
        }
    }

    removeAttachment(att: { file: string; filename: string }) {
        const index = this.newPost.attachments?.indexOf(att);
        if (index !== -1 && index !== undefined) {
            this.newPost.attachments?.splice(index, 1);
        }
    }

    editPost(news: News) {
        if (!(news.categories?.length)) {
            this.errorFields = {
                ...(news.categories?.length ? {} : { categories: 'news.category_required' }),
            };
            return;
        }

        if (!news.content?.trim() && !news.images?.length && !news.attachments?.length) {
            this._alertService.showAlert({
                title: this.translocoService.translate(
                    'other.error_title'
                ),
                message:
                    this.translocoService.translate('errors.fields.news_required'),
                type: 'error',
            });
            return;
        }

        news.categories = this.selectedCatIds;
        const payload: CreateNewsRequest = {
            ...news,
            image_urls: news.images.map(img => typeof img === 'string' ? img : img.image),
            attachment_items: news.attachments.map(file => ({
                file: typeof file === 'string' ? file : file.file,
                filename: file.filename || 'Tệp đính kèm'
            })),
        };
        this._newsService.updateNews(news.id, payload).subscribe(
            (news) => {
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.success_title'),
                    message: this.translocoService.translate('news.success_update_message'),
                    type: 'success'
                });
                this.closeEditNewsPopup();
                this.loadNews();
            },
            (error) => {
                console.error('Error updating news:', error);
                if (error?.error?.code === 'VALIDATION_ERROR' && Array.isArray(error.error.errors)) {
                    error.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        let code = field;
                        
                        if (field === 'slug') {
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
        );
    }

    openApprovePopup() {
        this.showApprovePopup = true;
    }

    closeApprovePopup() {
        this.showApprovePopup = false;
    }
    
    approveAllNews() {
        this.checkboxSelected.forEach((news) => {
            this._newsService.updateNews(news.id, { status: 2 }).subscribe({
                next: (res) => {
                    this.closeApprovePopup();
                    this.checkboxSelected = [];
                    this.loadNews();
                    this._alertService.showAlert({
                        title: this.translocoService.translate(
                            'news.success_title'
                        ),
                        message: this.translocoService.translate(
                            'news.success_approve_message'
                        ),
                        type: 'success',
                    });
                },
            });
        });
    }
}
