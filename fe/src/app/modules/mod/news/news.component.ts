import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';
import { HttpClient } from '@angular/common/http';
import { NewsService } from 'app/core/admin/news/news.service';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { AngularEditorModule, AngularEditorConfig } from '@kolkov/angular-editor';
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
    styles: ``
})
export class NewsComponent implements OnInit {
    @ViewChild('categoryList') categoryList: ElementRef;
    @ViewChild('editor') editorComp: any;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    users: any[] = [];
    news: any[] = [];
    likedUsers: any[] = [];
    selectedSlug: string | null = null;
    selectedParentSlug: string | null = null;
    usernames: { [id: number]: string } = {};  
    currentUserId: number | null = null;
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
    selectedCategory: number | null = null;
    selectedCreatedBy: number | null = null;

    // popup
    showAddCategoryPopup: boolean = false;
    showUpdateCategoryPopup: boolean = false;
    showCreateNewsPopup: boolean = false;
    showDeleteAllPopup: boolean = false;
    checkboxSelected: any[] = [];
    showLikedUsersPopup: boolean = false;
    showFilterPopup: boolean = false;

    newCategory: { name: string; slug: string; category_parent: number } = { name: '', slug: '', category_parent: null };
    newNews: Partial<News> & { category?: number } = {
        title: '',
        slug: '',
        content: '',
        thumbnail: '',
        category: undefined
    };

    isImageLoading: boolean = false;
    imageError: boolean = false;

    // scroll
    showChevronLeft = false;
    showChevronRight = true;

    //error hiển thị lỗi
    errorFields: { [key: string]: string } = {};
    globalErrorMessage: string = '';

    //editor
    showImagePopup: boolean = false;
    imageUrl: string = '';
    insertFn: any;
    savedSelection: Range | null = null;
    handleImageLoad(event: Event) {
        this.isImageLoading = false;
        this.imageError = false;
    }

    handleImageError(event: Event) {
        this.isImageLoading = false;
        this.imageError = true;
    }

    editorConfig: AngularEditorConfig = {
        editable: true,
        spellcheck: true,
        height: '15rem',
        minHeight: '5rem',
        translate: 'no',
        defaultParagraphSeparator: 'p',
        defaultFontName: 'Arial',
        fonts: [
            { class: 'arial', name: 'Arial' },
            { class: 'times-new-roman', name: 'Times New Roman' },
            { class: 'calibri', name: 'Calibri' },
            { class: 'comic-sans-ms', name: 'Comic Sans MS' }
        ],
        toolbarHiddenButtons: [
            ['insertImage', 'insertVideo']
        ],
        toolbarPosition: 'top',
        enableToolbar: true,
        showToolbar: true,
        sanitize: false,
        uploadUrl: uriConfig.API_UPLOAD_IMAGE,
        uploadWithCredentials: false,
        customClasses: [
            {
                name: 'insert-image',
                class: 'insert-image',
            },
        ],
    };

    openImagePopup(executeFn: any) {
        this.insertFn = executeFn;
        this.showImagePopup = true;

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            this.savedSelection = selection.getRangeAt(0).cloneRange();
        }
    }

    closePopup() {
        this.showImagePopup = false;
        this.imageUrl = '';
    }

    async onFileImageSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        console.log('file', file);
        try {

            if (!file.type.startsWith('image/')) {
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('news.error_image_format'),
                    type: 'error'
                });
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            this._newsService.uploadImage(formData).subscribe(res => {
                console.log('res', res);
                if (res?.data?.url) {
                    this.imageUrl = res.data.url;
                    this.insertImage();
                }
            });
        } catch (error) {
            console.error('Upload error:', error);
            this._alertService.showAlert({
                title: this.translocoService.translate('other.error_title'),
                message: this.translocoService.translate('news.error_image_upload'),
                type: 'error'
            });
        }
    }

    insertImage() {
        if (this.imageUrl) {
            // Kiểm tra đuôi file ảnh nếu là nhập url
            const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const urlExt = this.imageUrl.split('.').pop()?.toLowerCase().split('?')[0];
            if (!urlExt || !allowedExt.includes(urlExt)) {
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('news.error_image_format'),
                    type: 'error'
                });
                this.imageUrl = '';
                this.showImagePopup = false;
                return;
            }
            // Tạo HTML ảnh
            const imgHtml = `
                <div style="box-sizing: inherit; margin: 0 auto; font-size: 15px; outline: 0px !important;">
                    <img src="${this.imageUrl}" 
                        alt="image" 
                        style="box-sizing: inherit; outline: 0px !important; display: block; max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                </div>
            `;
    
            // Nếu có selection thì chèn vào vị trí đó trong content
            if (this.savedSelection) {
                // Lấy editor element
                const editor = document.querySelector('angular-editor .angular-editor-textarea') as HTMLElement;
                if (editor) {
                    // Lấy vị trí selection trong content
                    const content = editor.innerHTML;
                    // Tạo một vùng tạm để thao tác
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;
    
                    // Chèn ảnh vào vị trí selection (phức tạp, có thể bỏ qua nếu không cần chính xác)
                    // Đơn giản nhất: chèn vào cuối content
                    tempDiv.innerHTML += imgHtml;
    
                    // Cập nhật lại content
                    this.newNews.content = tempDiv.innerHTML;
                }
            } else {
                // Không có selection, chèn vào cuối content
                this.newNews.content = (this.newNews.content || '') + imgHtml;
            }
    
            this.savedSelection = null;
            this.closePopup();
    
            this._alertService.showAlert({
                title: this.translocoService.translate('other.success_title'),
                message: this.translocoService.translate('news.success_image_insert'),
                type: 'success'
            });
        }
    }

    onCategoryListScroll() {
        if (!this.categoryList || !this.categoryList.nativeElement) return;
        const el = this.categoryList.nativeElement;
        this.showChevronLeft = el.scrollLeft > 0;
        this.showChevronRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    }

    scrollCategoryListLeft() {
        if (this.categoryList && this.categoryList.nativeElement) {
            this.categoryList.nativeElement.scrollBy({ left: -150, behavior: 'smooth' });
            setTimeout(() => this.onCategoryListScroll(), 300);
        }
    }

    scrollCategoryListRight() {
        if (this.categoryList && this.categoryList.nativeElement) {
            this.categoryList.nativeElement.scrollBy({ left: 150, behavior: 'smooth' });
            setTimeout(() => this.onCategoryListScroll(), 300);
        }
    }



    constructor(
        private _newsCategoryService: NewsCategoryService,
        private _newsService: NewsService,
        private http: HttpClient,
        private _alertService: AlertService,
        public translocoService: TranslocoService,
        private _userService: UserService
    ) { }


    ngOnInit() {
        this._userService.itemUser$.subscribe(user => {
            this.currentUserId = user?.id || null;
        });
        this._userService.getAllUser().subscribe(users => {
            this.users = users;
        });
        this.loadNewsCategory();
        this.loadNews(); 
    }

    openLikedUsersPopup(news: any) {
        // likedBy dạng { user: [...], total: n }
        this.likedUsers = Array.isArray(news.likedBy?.user) ? news.likedBy.user : [];
        this.showLikedUsersPopup = true;
    }
    
    closeLikedUsersPopup() {
        this.showLikedUsersPopup = false;
        this.likedUsers = [];
    }

    loadNewsCategory() {
        const payload: any = {
            pageIndex: 1,
            pageSize: 1000
        }
        this._newsCategoryService.getNewsCategories(payload).subscribe(([categories_parent, totalNewsCategory]) => {
            // Thêm thuộc tính selected và expanded cho từng object
            this.categories_parent = categories_parent.map(cat => ({
                ...cat,
                selected: false,
                expanded: false
            }));
            setTimeout(() => this.onCategoryListScroll(), 0);
            this.categories_child = [];
            this.categories = [];
            for (const cat of this.categories_parent) {
                const childrenWithParent = cat.children.map(child => ({
                    ...child,
                    categoryParent: cat.id
                }));
                this.categories_child = this.categories_child.concat(childrenWithParent);
                this.categories.push(cat);
                this.categories = this.categories.concat(childrenWithParent);
            }
        });
    };
    
    toggleSearch(event: Event): void {
        event.stopPropagation();
        this.isSearching = !this.isSearching;
    }
    
    onSearchChange() {
        this.currentPage = 1;
        this.loadNews();
    }


    getCategoryNameById(id: number): string {
        const category = this.categories.find(c => c.id === id);
        return category ? category.name : id.toString();
    }



    loadNews() {
        const payload = this.getPayload();
        this._newsService.getAllNews(payload).subscribe(([news, totalNews]) => {
            // Xử lý news ở đây
            this.news = news;
            this.totalNews = totalNews;
            this.totalPages = Math.ceil(this.totalNews / this.pageSize);
            // this.updatePagedNews();
        });
    }

    loadNewsByCategory(cat: any) {
        const payload = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            "category_ids": cat
        };
        this._newsService.getNewsByCategory(payload).subscribe(([news, totalNews]) => {
            this.news = news;
            this.totalNews = totalNews;
            this.totalPages = Math.ceil(this.totalNews / this.pageSize);
        });
    }

    onPageChange(page: number) {
        this.currentPage = page;
        if (this.selectedSlug) {
            // Tìm lại category đang chọn
            let selectedCategory: any = this.categories.find(cat => cat.slug === this.selectedSlug)
                || this.categories_child.find(cat => cat.slug === this.selectedSlug);
            if (selectedCategory) {
                this.loadNewsByCategory(selectedCategory);
            }
        } else {
            this.loadNews();
        }
        this.checkboxSelected = [];
    }

    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.currentPage = 1;
        if (this.selectedSlug) {
            let selectedCategory: any = this.categories.find(cat => cat.slug === this.selectedSlug)
                || this.categories_child.find(cat => cat.slug === this.selectedSlug);
            if (selectedCategory) {
                this.loadNewsByCategory(selectedCategory);
            }
        } else {
            this.loadNews();
        }
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
        this.selectedCategory = null;
        this.selectedCreatedBy = null;
        this.showFilterPopup = false;
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
        this.loadNews(); // Gọi lại hàm lấy dữ liệu với điều kiện lọc mới
    }


    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            filterRules: []
        };
        if (this.searchText) {
            payload.searchRule = {
                fields: ['title', 'content'],
                option: 'contains',
                value: this.searchText
            };
        }
        if (this.sortField) {
            payload.sortRule = {
                field: this.sortField,
                option: this.sortOption
            };
        }
        if (this.selectedCategory) {
            payload.filterRules.push({
                field: 'category',
                option: 'exact',
                value: this.selectedCategory
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
        return payload;
    }

    onHomeClick(event: Event) {
        event.preventDefault();
        this.currentPage = 1;
        this.selectedSlug = null;
        this.checkboxSelected = [];
        this.loadNews();
    }

    onCategoryClick(event: Event, cat: any) {
        event.preventDefault();
        this.currentPage = 1;
        this.selectedSlug = cat.slug;
        if (this.categories_parent.some(parent => parent.slug === cat.slug)) {
            this.selectedParentSlug = cat.slug;
        } else {
            // Tìm parent dựa vào category_parent
            const parent = this.categories_parent.find(parent => parent.id === cat.category_parent);
            this.selectedParentSlug = parent ? parent.slug : null;
        }
        this.loadNewsByCategory(cat);
    }


    closeCreateNewsPopup() {
        this.showCreateNewsPopup = false;
        this.errorFields = {};
        this.newNews = {
            title: '',
            slug: '',
            content: '',
            thumbnail: '',
            category: undefined
        };
        this.currentPage = 1;
    }

    createNews() {
        // if (!this.selectedSlug) {
        //     this._alertService.showAlert({
        //         title: this.translocoService.translate('news.error_title'),
        //         message: this.translocoService.translate('news.error_select_category_first'),
        //         type: 'error',
        //     });
        //     return;
        // }
        this.showCreateNewsPopup = true;
    }

    submitCreateNews() {
        if (!this.newNews.title || !this.newNews.content) {
            this._alertService.showAlert({
                title: this.translocoService.translate('news.error_title'),
                message: this.translocoService.translate('news.error_required_fields'),
                type: 'error',
            });
            return;
        }

        let selectedCategory: any;
        if (this.isChildCategory(this.selectedSlug)) {
            selectedCategory = this.categories_child.find(cat => cat.slug === this.selectedSlug);
        } else {
            selectedCategory = this.categories_parent.find(cat => cat.slug === this.selectedSlug);
        }
        // if (!selectedCategory) {
        //     this._alertService.showAlert({
        //         title: this.translocoService.translate('news.error_title'),
        //         message: this.translocoService.translate('news.error_no_category'),
        //         type: 'error',
        //     });
        //     return;
        // }

        // this.newNews.category = selectedCategory.id;

        this._newsService.createNews(this.newNews as News).subscribe({
            next: () => {
                this.closeCreateNewsPopup();
                if (selectedCategory) {
                    this.onCategoryClick(new Event('click'), selectedCategory);
                } else {
                    this.onHomeClick(new Event('click'));
                }
                
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.success_title'),
                    message: this.translocoService.translate('news.success_create_message'),
                    type: 'success'
                });
            },
            error: (err) => {
                console.error('Create error:', err);
                if (err?.error?.code === 'VALIDATION_ERROR' && Array.isArray(err.error.errors)) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        // console.log('msg: ', msg);
                        let code = field;

                        // if (field === 'slug') {
                        //     if (msg.includes('already exists')) {
                        //         code = 'slug_exists';
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
    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            this.isImageLoading = true;
            this.imageError = false;

            try {
    
                // Kiểm tra định dạng file
                if (!file.type.startsWith('image/')) {
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('news.error_image_format'),
                        type: 'error'
                    });
                    this.isImageLoading = false;
                    return;
                }
    
                const formData = new FormData();
                formData.append('image', file);
    
                // Gửi API upload ảnh
                this._newsService.uploadImage(formData).subscribe({
                    next: (res) => {
                        if (res?.data?.url) {
                            this.newNews.thumbnail = res.data.url;
                            this.isImageLoading = false;
                        }
                    },
                    error: (error) => {
                        console.error('Upload error:', error);
                        this.imageError = true;
                        this.isImageLoading = false;
                        this._alertService.showAlert({
                            title: this.translocoService.translate('other.error_title'),
                            message: this.translocoService.translate('news.error_image_upload'),
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
                    message: this.translocoService.translate('news.error_image_upload'),
                    type: 'error'
                });
            }
        }
    }

    getChildCategories(slug: string): any[] {
        // Luôn trả về children của parent, kể cả khi slug là của child
        const child = this.categories_child.find(cat => cat.slug === slug);
        if (child) {
            return this.categories_child.filter(c => c.categoryParent === child.categoryParent);
        }
        let parent = this.categories_parent.find(cat => cat.slug === slug);
        if (!parent) {
            // Nếu slug là của child, tìm parent của nó
            const child = this.categories_child.find(cat => cat.slug === slug);
            if (child) {
                parent = this.categories_parent.find(cat => cat.id === child.categoryParent || cat.id === child.category_parent);
            }
        }
        return parent ? parent.children : [];
    }

    isChildCategory(slug: string): boolean {
        return this.categories_child.some(cat => cat.slug === slug);
    }

    isAllSelected(): boolean {
        if (this.news.length === 0) return false;
        return this.checkboxSelected.length === this.news.length;
    }

    isAuthor(news: any): boolean {
        return news?.createdBy?.id === this.currentUserId;
    }

    onCheckboxChangeAll(event: Event) {
        const checkbox = event.target as HTMLInputElement;
        const isChecked = checkbox.checked;
        if (isChecked) {
            this.checkboxSelected = this.news;
            this.news.forEach(news => {
                news.selected = true;
            });
            console.log('checkboxSelected', this.checkboxSelected);
        } else {
            this.checkboxSelected = [];
            this.news.forEach(news => {
                news.selected = false;
            });
            console.log('checkboxSelected', this.checkboxSelected);
        }
    }

    openDeleteAllPopup() {
        this.showDeleteAllPopup = true;
    }

    closeDeleteAllPopup() {
        this.showDeleteAllPopup = false;
        this.checkboxSelected = [];
        this.selectedSlug = null;
    }

    deleteAllNews() {
        this.checkboxSelected.forEach(news => {
            if (!this.isAuthor(news)) {
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.error_title'),
                    message: this.translocoService.translate('news.error_not_author'),
                    type: 'error'
                });
                return;
            }
            this._newsService.deleteNews(news.id).subscribe(() => {
                this.closeDeleteAllPopup();
                this.loadNews();
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.success_title'),
                    message: this.translocoService.translate('news.success_delete_message'),
                    type: 'success'
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
            this.checkboxSelected = this.checkboxSelected.filter(n => n.id !== news.id);
            console.log('checkboxSelected', this.checkboxSelected);
        }
    }
}
