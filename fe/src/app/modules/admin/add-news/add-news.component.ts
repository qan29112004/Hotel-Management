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
import {
    AngularEditorModule,
    AngularEditorConfig,
} from '@kolkov/angular-editor';
import { News } from 'app/core/admin/news/news.types';
import { Router, RouterModule } from '@angular/router';
import { uriConfig } from 'app/core/uri/config';

@Component({
    selector: 'app-add-news',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        AngularEditorModule,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './add-news.component.html',
    styles: ``,
})
export class AddNewsComponent implements OnInit {
    // @ViewChild('categoryList', { static: false })
    @ViewChild('categoryList') categoryList: ElementRef;
    @ViewChild('editor') editorComp: any;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    selectedCategoryIds: any[] = [];
    showCategoryDropdown: boolean = false;

    newNews: Partial<News> & { categories?: number[] } = {
        title: '',
        slug: '',
        content: '',
        thumbnail: '',
        categories: undefined,
    };

    // Image loading states
    isImageLoading: boolean = false;
    imageError: boolean = false;


    //error hiển thị lỗi
    errorFields: { [key: string]: string } = {};

    //editor
    savedSelection: Range | null = null;
    showImagePopup: boolean = false;
    imageUrl: string = '';
    insertFn: any;

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
            { class: 'comic-sans-ms', name: 'Comic Sans MS' },
        ],
        toolbarHiddenButtons: [['insertImage', 'insertVideo']],
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
        console.log('hehehehehe', executeFn)
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
            this._newsService.uploadImage(formData).subscribe((res) => {
                if (res?.data?.url) {
                    this.imageUrl = res.data.url;
                    this.insertImage();
                }
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

    insertImage() {
        if (this.imageUrl) {
            // Kiểm tra đuôi file ảnh nếu là nhập url
            const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const urlExt = this.imageUrl
                .split('.')
                .pop()
                ?.toLowerCase()
                .split('?')[0];
            if (!urlExt || !allowedExt.includes(urlExt)) {
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate(
                        'news.error_image_format'
                    ),
                    type: 'error',
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
                const editor = document.querySelector(
                    'angular-editor .angular-editor-textarea'
                ) as HTMLElement;
                if (editor) {
                    // Lấy vị trí selection trong content
                    const content = editor.innerHTML;
                    // Tạo một vùng tạm để thao tác
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = content;

                    tempDiv.innerHTML += imgHtml;

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
                message: this.translocoService.translate(
                    'news.success_image_insert'
                ),
                type: 'success',
            });
        }
    }
    constructor(
        private _newsCategoryService: NewsCategoryService,
        private _newsService: NewsService,
        private http: HttpClient, // Thêm nếu chưa có
        private _alertService: AlertService,
        public translocoService: TranslocoService,
        private _router: Router,
    ) {}
    ngOnInit() {
        this.loadNewsCategory();
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

    get selectedCategories() {
        return this.categories.filter(cat => this.selectedCategoryIds.includes(cat.id));
    }

    removeCategory(catId: number): void {
        this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== catId);
        this.newNews.categories = this.selectedCategoryIds;
    }

    onCategorySelect(catId: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedCategoryIds.includes(catId)) {
                this.selectedCategoryIds.push(catId);
            }
        } else {
            this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== catId);
        }
        this.newNews.categories = this.selectedCategoryIds
    }

    submitCreateNews() {
        // Validate required fields
        if (!this.newNews.title || !this.newNews.content) {
            this._alertService.showAlert({
                title: this.translocoService.translate('news.error_title'),
                message: this.translocoService.translate(
                    'news.error_required_fields'
                ),
                type: 'error',
            });
            return;
        }

        if (this.newNews.title && this.newNews.title.length > 255) {
            this.errorFields['title'] = 'Vui lòng nhập tối đa 255 ký tự';
            return;
        }

        if (this.newNews.thumbnail) {
            // Kiểm tra đuôi file ảnh nếu là nhập url
            const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const urlExt = this.newNews.thumbnail
                .split('.')
                .pop()
                ?.toLowerCase()
                .split('?')[0];
            if (!urlExt || !allowedExt.includes(urlExt)) {
                this.errorFields['thumbnail'] = this.translocoService.translate('news.error_image_format');
                return;
            }
        }

        this._newsService.createNews(this.newNews as News).subscribe({
            next: () => {
                this._router.navigate(['/admin/news']);
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'news.success_title'
                    ),
                    message: this.translocoService.translate(
                        'news.success_create_message'
                    ),
                    type: 'success',
                });
            },
            error: (err) => {
                console.error('Create error:', err);
                if (
                    err?.error?.code === 'VALIDATION_ERROR' &&
                    Array.isArray(err.error.errors)
                ) {
                    err.error.errors.forEach((e: any) => {
                        const field = e.field;
                        const msg = e.message?.toLowerCase() || '';
                        // console.log('msg: ', msg);
                        let code = field;

                        // if (field === 'category') {
                        //     if (msg.includes('already exists')) {
                        //         code = 'slug_exists';
                        //     }
                        // }
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
                        title: this.translocoService.translate(
                            'other.error_title'
                        ),
                        message: this.translocoService.translate(
                            'news.error_image_format'
                        ),
                        type: 'error',
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
                this.imageError = true;
                this.isImageLoading = false;
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
}