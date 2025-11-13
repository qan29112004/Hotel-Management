import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NewsService } from 'app/core/admin/news/news.service';
import { News } from 'app/core/admin/news/news.types';
import { FormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule } from '@kolkov/angular-editor';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { UserService } from 'app/core/profile/user/user.service';
import { uriConfig } from 'app/core/uri/config';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';

@Component({
    selector: 'app-news-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        AngularEditorModule
    ],
    templateUrl: './news-detail.component.html',
    styles: ``
})
export class NewsDetailComponent implements OnInit {
    @ViewChild('fileInput') fileInput: ElementRef;
    news: News | null = null;
    message: string | null = null;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    showUpdateNewsPopup = false;
    errorFields: { [key: string]: string } = {};
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
    currentUserId: number | null = null;
    isImageLoading = false;
    imageError = false;
    showImagePopup = false;
    imageUrl = '';
    insertFn: any;
    savedSelection: Range | null = null;
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
        try {

            // Kiểm tra định dạng file
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

            // Gửi API upload ảnh
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
                    this.news.content = tempDiv.innerHTML;
                }
            } else {
                // Không có selection, chèn vào cuối content
                this.news.content = (this.news.content || '') + imgHtml;
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

    constructor(
        private _route: ActivatedRoute,
        private _newsService: NewsService,
        private _alertService: AlertService,
        private _router: Router,
        private translocoService: TranslocoService,
        private _userService: UserService,
        private _newsCategoryService: NewsCategoryService,
    ) { }

    ngOnInit() {
        this._userService.itemUser$.subscribe(user => {
            this.currentUserId = user?.id || null;
        });
        this.loadNewsCategory();
        this._route.params.subscribe(params => {
            const slugWithHtml = params['slug'];
            const slug = slugWithHtml.replace(/\.html$/, '');
            if (slug) {
                this.loadNewsDetail(slug);
            }
        });
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

    loadNewsDetail(slug: string) {
        this._newsService.getNewsBySlug(slug).subscribe(
            (news) => {
                this.news = news;
            },
            (error) => {
                console.error('Error loading news:', error);
            }
        );
    }

    
    get isLiked(): boolean {
        if (!this.news || !this.news.likedBy || !this.currentUserId) return false;
        // Nếu likedBy là mảng user object
        return this.news.likedBy.user?.some(u => u.id === this.currentUserId);
        // Nếu likedBy là mảng username
        // return this.news.likedBy.some(u => u.username === this.currentUser.username);
    }

    likeNews(id: number){
        this._newsService.likeNews(id).subscribe(
            (res) => {
                this.message = res.message;
                // Cập nhật lại danh sách likedBy
                if (this.news && res.liked_by) {
                    this.news.likedBy = { user: res.liked_by, total: res.liked_by.length };
                }
                this.loadNewsDetail(this.news.slug);
            },
            (error) => {
                console.error('Error like news: ', error);
            }
        )
    }


    closeUpdateNewsPopup() {
        this.showUpdateNewsPopup = false;
        this.loadNewsDetail(this.news?.slug);
    }
    submitUpdateNews() {
        this.errorFields = {};
        this._newsService.updateNews(this.news?.id, this.news).subscribe(
            (news) => {
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.success_title'),
                    message: this.translocoService.translate('news.success_update_message'),
                    type: 'success'
                });
                this.closeUpdateNewsPopup();
                const newSlug = news.slug;
                this._router.navigate(['/mod/news', `${newSlug}.html`]);
                this.loadNewsDetail(newSlug);
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
    deleteNews() {
        this._newsService.deleteNews(this.news?.id).subscribe(
            (news) => {
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.success_title'),
                    message: this.translocoService.translate('news.success_delete_message'),
                    type: 'success'
                });
                this._router.navigate(['user/news']);
            },
            (error) => {
                console.error('Error deleting news:', error);
                this._alertService.showAlert({
                    title: this.translocoService.translate('news.error_title'),
                    message: this.translocoService.translate('news.error_delete_message'),
                    type: 'error'
                });
            }
        );
    }
    clearFieldError(field: string): void {
        if (this.errorFields[field]) {
            delete this.errorFields[field];
        }
    }

    // Check if current user is the author of the news
    isAuthor(): boolean {
        return this.news?.createdBy?.id === this.currentUserId;
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
                            this.news.thumbnail = res.data.url;
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

    handleImageError(event: Event) {
        this.imageError = true;
        this.isImageLoading = false;
    }

    handleImageLoad(event: Event) {
        this.imageError = false;
        this.isImageLoading = false;
    }
}
