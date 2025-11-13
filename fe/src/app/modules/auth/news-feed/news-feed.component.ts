import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { RouterModule } from '@angular/router';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateNewsRequest, NewsService } from 'app/core/admin/news/news.service';
import { MatIconModule } from '@angular/material/icon';
import { NewsCategoryService } from 'app/core/admin/news-category/news-category.service';
import { UserService } from 'app/core/profile/user/user.service';
import { News, NewsComment } from 'app/core/admin/news/news.types';
import { User } from 'app/core/profile/user/user.types';

@Component({
    selector: 'news-feed',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './news-feed.component.html',
    styles: ``
})
export class NewsFeedComponent {
    @ViewChild('commentInput') commentInputRef!: ElementRef<HTMLTextAreaElement>;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    users: any[] = [];
    users_search: any[] = [];
    news: any[] = [];
    commentsMap: { [newsId: number]: any[] } = {};
    commentTotalMap: { [newsId: number]: number } = {};
    textOnlyContent: string = '';
    imageUrls: string[] = [];
    currentUser: User;
    likedUsers: any[] = [];
    commentOfNews: any[] = [];


    // Phân trang
    currentPage: number = 1;
    pageSize: number = 100;

    // Popup
    showCreateNewsPopup: boolean = false;
    showImagePopup: boolean = false;
    showLikedUsersPopup: boolean = false;
    showCommentViewPopup: boolean = false;
    showSearchPopup: boolean = false;

    //error hiển thị lỗi
    errorFields: { [key: string]: string } = {};

    // filter
    selectedCategoryIds: number[] = [];
    showCategoryDropdown: boolean = false;

    //tìm kiếm
    isSearching: boolean = false;
    searchText: string = '';

    // Xem thêm/Ẩn bớt
    expandedPostIds = new Set<number>();

    selectedImageIndex = 0;
    selectedPost: News = null;
    showImageViewPopup = false;
    @ViewChild('categoryDropdownOutside') categoryDropdownOutsideRef: ElementRef;
    @ViewChild('categoryDropdownPopup') categoryDropdownPopupRef: ElementRef;


    showCategory: boolean = false;
    selectedCatIds: number[] = [];
    newPost: Partial<News> & { categories?: number[] } = {
        slug: '',
        content: '',
        images: [],
        attachments: [],
        categories: undefined,
    };


    newComment: Partial<NewsComment> = {
        content: '',
        parent: null
    };


    constructor(
        protected _newsCategoryService: NewsCategoryService,
        protected _newsService: NewsService,
        protected _alertService: AlertService,
        public translocoService: TranslocoService,
        protected _userService: UserService,
        protected _eref: ElementRef
    ) { }



    ngOnInit() {
        this._userService.itemUser$.subscribe(user => {
            this.currentUser = user || null;
        });
        this._userService.getAllUser().subscribe(users => {
            this.users = users;
        });
        this.loadUser();
        this.loadNews();
        this.loadNewsCategory();
    }

    loadUser() {
        let payload: any = {};
        if (this.searchText) {
            payload.searchRule = {
            fields: ['username', 'full_name'],
            option: 'contains',
            value: this.searchText,
            };
        }

        this._userService.getAllUser(payload).subscribe(users => {
            this.users_search = users;
        });
    }
      

    onSearchChange() {
        // console.log('this.searchText', this.searchText);
        this.loadUser();
    }

    clearSearch(): void {
        this.searchText = '';
        this.onSearchChange(); // Gọi lại hàm lọc nếu cần
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

    loadNews() {
        const payload = this.getPayload();
        // console.log('payload', payload);
        this._newsService.getNews(payload).subscribe(([news, totalNews]) => {
            // Xử lý news ở đây
            this.news = news
            this.news.forEach(post => this.getNewsComment(post.id));
        });
    }

    loadNewsByCategory(cat: any) {
        const payload = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            "category_ids": cat
        };
        this._newsService
            .getNewsByCategory(payload)
            .subscribe(([news, totalNews]) => {
                this.news = news;
            });
    }

    toggleExpand(postId: number) {
        if (this.expandedPostIds.has(postId)) {
          this.expandedPostIds.delete(postId);
        } else {
          this.expandedPostIds.add(postId);
        }
      }
      
    isExpanded(postId: number): boolean {
        return this.expandedPostIds.has(postId);
    }

    isClamped(post: News): boolean {
        return post.content.length > 100; // tuỳ ngưỡng bạn chọn
    }    

    onCategoryFilterChange(catId: number, event: any) {
        if (event.target.checked) {
            if (!this.selectedCategoryIds.includes(catId)) {
                this.selectedCategoryIds.push(catId);
                this.loadNews();
            }
        } else {
            this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== catId);
            this.loadNews();
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
        // this.newNews.categories = this.selectedCategoryIds;

        this.loadNews();
    }

    removeCat(catId: number): void {
        this.selectedCatIds = this.selectedCatIds.filter(id => id !== catId);
        // this.newNews.categories = this.selectedCategoryIds;

    }

    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event): void {
      const target = event.target as HTMLElement;
    
      // Dropdown ngoài feed
      if (
        this.showCategoryDropdown &&
        this.categoryDropdownOutsideRef &&
        !this.categoryDropdownOutsideRef.nativeElement.contains(target)
      ) {
        this.showCategoryDropdown = false;
      }
    
      // Dropdown trong popup
      if (
        this.showCategory &&
        this.categoryDropdownPopupRef &&
        !this.categoryDropdownPopupRef.nativeElement.contains(target)
      ) {
        this.showCategory = false;
      }
    }
    
    openSearchPopup() {
        this.showSearchPopup = true;
    }

    closeSearchPopup() {
        this.searchText = '',
        this.showSearchPopup = false;
        this.loadUser();
    }

    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
            filterRules: []
        };
        // lọc theo category
        if (this.selectedCategoryIds.length > 0) {
            payload.filterRules.push({
                field: 'categories',
                option: 'in',
                value: this.selectedCategoryIds
            });
        }

        return payload;
    }

    isLiked(id: number): boolean {
        const post = this.news.find(n => n.id === id);
        if (!post || !post.likedBy || !this.currentUser) return false;
        return post.likedBy.user?.some(u => u.id === this.currentUser.id);
    }

    likeNews(postId: number) {
        const post = this.news.find(p => p.id === postId);
        if (!post || !this.currentUser) return;

        const userId = this.currentUser.id;

        // ✅ Ensure likedBy exists
        if (!post.likedBy) post.likedBy = { user: [], total: 0 };
        if (!post.likedBy.user) post.likedBy.user = [];

        const isCurrentlyLiked = post.likedBy.user.some(u => u.id === userId);
        const oldLikedUsers = [...post.likedBy.user];

        // ✅ Optimistic update
        if (isCurrentlyLiked) {
            post.likedBy.user = post.likedBy.user.filter(u => u.id !== userId);
        } else {
            post.likedBy.user = [...post.likedBy.user, {
                id: userId,
                username: this.currentUser.username,
                avatar: this.currentUser.avatar || '',
                fullName: this.currentUser.fullName || '',
            }];
        }

        post.likedBy.total = post.likedBy.user.length;

        this._newsService.likeNews(postId).subscribe({
            next: (res) => {
                if (res?.liked_by) {
                    post.likedBy.user = res.liked_by.map((u: any) => ({
                        id: u.id,
                        username: u.username,
                        avatar: u.avatar || '',
                        fullname: u.fullname || u.fullName || '',   // chuẩn hóa key
                    }));
                    post.likedBy.total = res.liked_by.length;
                }
            },
            error: (err) => {
                console.error('❌ Like failed, rollback', err);
                post.likedBy.user = oldLikedUsers;
                post.likedBy.total = oldLikedUsers.length;
            }
        });
    }

    openLikedUsersPopup(post: any) {
        // likedBy dạng { user: [...], total: n }
        this.likedUsers = Array.isArray(post.likedBy?.user) ? post.likedBy.user : [];
        console.log('like', this.likedUsers)
        console.log('fn', this.currentUser.fullName)
        this.showLikedUsersPopup = true;
    }

    closeLikedUsersPopup() {
        this.showLikedUsersPopup = false;
        this.likedUsers = [];
    }

    openDetail(post: News) {
        if (post.images.length > 0) {
            this.openImagePopup(0, post);
        } else {
            this.showCommentViewPopup = true;
            this.selectedPost = post;
            console.log(this.selectedPost)
            this.commentOfNews = this.commentsMap[post.id];
        }
    }

    closeDetail() {
        this.showCommentViewPopup = false;
        this.commentOfNews = []
        this.selectedPost = null;
    }

    openCreateNewsPopup() {
        this.showCreateNewsPopup = true;
    }

    closeCreateNewsPopup() {
        this.newPost = {
            slug: '',
            content: '',
            images: [],
            attachments: [],
            categories: [],
        };
        this.selectedCatIds = [];
        this.errorFields = {};
        this.showCreateNewsPopup = false;
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
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) return;
        Array.from(files).forEach((file) => {
            // Kiểm tra định dạng file
            if (!file.type.startsWith('image/')) {
                this._alertService.showAlert({
                    title: this.translocoService.translate('other.error_title'),
                    message: this.translocoService.translate('news.error_image_format'),
                    type: 'error',
                });
                return;
            }
    
            const formData = new FormData();
            formData.append('image', file);
    
            this._newsService.uploadImage(formData).subscribe({
                next: (res) => {
                    if (res?.data?.url) {
                        this.newPost.images.push(res.data.url);
                    }
                },
                error: (error) => {
                    console.error('Upload error:', error);
                    this._alertService.showAlert({
                        title: this.translocoService.translate('other.error_title'),
                        message: this.translocoService.translate('news.error_image_upload'),
                        type: 'error',
                    });
                },
            });
        });
    
        // Clear input để chọn lại cùng file lần nữa nếu cần
        (event.target as HTMLInputElement).value = '';
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
                        if (
                            err?.error?.code === 'INVALID_REQUEST'
                        ) {
                            const msg = err.error.errors[0].message?.toLowerCase() || '';
                            if (msg.includes('invalid file type')) {
                                this._alertService.showAlert({
                                    title: this.translocoService.translate(
                                        'other.error_title'
                                    ),
                                    message:
                                        this.translocoService.translate('news-feed.file_error'),
                                    type: 'error',
                                });
                            }
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


    createdPost(data: Partial<News> & { categories?: number[] }): void {
        // Validate
        if (!(data.categories?.length)) {
            this.errorFields = {
                ...(data.categories?.length ? {} : { categories: 'news.category_required' }),
            };
            return;
        }

        if (!data.content?.trim() && !data.images?.length && !data.attachments?.length) {
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

        const payload: CreateNewsRequest = {
            ...this.newPost,
            image_urls: this.newPost.images,
            attachment_items: this.newPost.attachments,
        };
        this._newsService.createNews(payload).subscribe({
            next: () => {
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'news.success_title'
                    ),
                    message: this.translocoService.translate(
                        'news.success_create_message'
                    ),
                    type: 'success',
                });
                this.closeCreateNewsPopup();
                this.loadNews();
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


    getNewsComment(id: number) {
        this._newsService.getCommentNews(id).subscribe(([comment, total]) => {
            // Xử lý news ở đây
            this.commentsMap[id] = comment;
            this.commentTotalMap[id] = total;
        });
    }

    isLikedSelected(): boolean {
        if (!this.selectedPost || !this.selectedPost.likedBy || !this.currentUser) return false;
        return this.selectedPost.likedBy.user?.some(u => u.id === this.currentUser.id);
    }

    openImagePopup(index: number, post: News) {
        this.selectedImageIndex = index;
        this.selectedPost = post;
        console.log(this.selectedPost)
        this.commentOfNews = this.commentsMap[post.id];
        this.showImageViewPopup = true;
    }

    closeImagePopup() {
        this.selectedImageIndex = null;
        this.showImageViewPopup = false;
        this.commentOfNews = []
        this.selectedPost = null;
    }

    focusCommentInput() {
        setTimeout(() => {
          this.commentInputRef?.nativeElement?.focus();
          this.commentInputRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
      }
      

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.showImageViewPopup) return;

        switch (event.key) {
            case 'Escape':
                this.closeImagePopup();
                break;
            case 'ArrowLeft':
                if (this.selectedImageIndex > 0) {
                    this.selectedImageIndex--;
                }
                break;
            case 'ArrowRight':
                if (this.selectedPost?.images && this.selectedImageIndex < this.selectedPost.images.length - 1) {
                    this.selectedImageIndex++;
                }
                break;
        }
    }

    getTimeAgo(dateString: string | Date): string {
        const date = new Date(dateString);
        const now = new Date();

        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays >= 1) {
            return `${diffDays} ${ this.translocoService.translate('news-feed.days_ago') }`;
        } else if (diffHours >= 1) {
            return `${diffHours} ${ this.translocoService.translate('news-feed.hours_ago') }`;
        } else if (diffMinutes >= 1) {
            return `${diffMinutes} ${ this.translocoService.translate('news-feed.minutes_ago') }`;
        } else {
            return `${diffSeconds} ${ this.translocoService.translate('news-feed.seconds_ago') }`;
        }
    }

    isLikedCmt(id: number): boolean {
        const cmt = this.commentOfNews.find(c => c.id === id);
        if (!cmt || !cmt.likedBy || !this.currentUser) return false;
        return cmt.likedBy.user?.some(u => u.id === this.currentUser.id);
    }

    likeComment(id: number) {
        const cmt = this.commentOfNews.find(c => c.id === id);
        if (!cmt || !this.currentUser) return;

        // Khởi tạo likedBy nếu chưa có
        if (!cmt.likedBy) cmt.likedBy = { user: [], total: 0 };
        if (!cmt.likedBy.user) cmt.likedBy.user = [];

        const userId = this.currentUser.id;
        const isCurrentlyLiked = cmt.likedBy.user.some(u => u.id === userId);
        const oldLikedUsers = [...cmt.likedBy.user];

        // ✅ Optimistic update
        if (isCurrentlyLiked) {
            cmt.likedBy.user = cmt.likedBy.user.filter(u => u.id !== userId);
        } else {
            cmt.likedBy.user = [...cmt.likedBy.user, {
                id: userId,
                username: this.currentUser.username,
                avatar: this.currentUser.avatar || ''
            }];
        }
        cmt.likedBy.total = cmt.likedBy.user.length;

        // ✅ Nếu đang ở popup chi tiết => cập nhật bản sao trong `commentsMap` luôn
        if (this.selectedPost && this.commentsMap[this.selectedPost.id]) {
            const mapCmt = this.commentsMap[this.selectedPost.id].find(c => c.id === id);
            if (mapCmt) {
                mapCmt.likedBy.user = [...cmt.likedBy.user];
                mapCmt.likedBy.total = cmt.likedBy.total;
            }
        }

        // ✅ Gọi API
        this._newsService.likeComment(id).subscribe({
            next: (res) => {
                if (res.liked_by) {
                    cmt.likedBy = {
                        user: res.liked_by,
                        total: res.liked_by.length
                    };

                    // Cập nhật lại map nếu cần
                    if (this.selectedPost && this.commentsMap[this.selectedPost.id]) {
                        const mapCmt = this.commentsMap[this.selectedPost.id].find(c => c.id === id);
                        if (mapCmt) {
                            mapCmt.likedBy = {
                                user: res.liked_by,
                                total: res.liked_by.length
                            };
                        }
                    }
                }
            },
            error: (err) => {
                console.error('❌ Like comment failed, rollback', err);
                cmt.likedBy.user = oldLikedUsers;
                cmt.likedBy.total = oldLikedUsers.length;

                if (this.selectedPost && this.commentsMap[this.selectedPost.id]) {
                    const mapCmt = this.commentsMap[this.selectedPost.id].find(c => c.id === id);
                    if (mapCmt) {
                        mapCmt.likedBy.user = [...oldLikedUsers];
                        mapCmt.likedBy.total = oldLikedUsers.length;
                    }
                }
            }
        });
    }

    sendComment(postId: number, payload: Partial<NewsComment>) {
        if (!payload.content?.trim()) return;

        const newCmt = {
            content: payload.content?.trim(),
            parent: payload.parent ?? null
        };

        const tempId = 'temp_' + Date.now(); // Tạo ID tạm độc nhất

        const optimisticComment = {
            ...newCmt,
            tempId,
            user: {
                id: this.currentUser.id,
                username: this.currentUser.username,
                avatar: this.currentUser.avatar
            },
            likedBy: { user: [], total: 0 },
            createdAt: new Date().toISOString(),
            image: '',
            replies: []
        };

        this.commentOfNews.unshift(optimisticComment);
        this.commentsMap[postId] = [optimisticComment, ...(this.commentsMap[postId] || [])];

        this._newsService.commentNews(postId, newCmt).subscribe({
            next: (res) => {
                const normalized = {
                    ...res,
                    likedBy: res.liked_by || { user: [], total: 0 },
                };

                const idx = this.commentOfNews.findIndex(c => c.tempId === tempId);
                if (idx !== -1) {
                    this.commentOfNews.splice(idx, 1); // Xóa comment tạm
                    this.commentOfNews.unshift(normalized); // Thêm comment thật lên đầu
                }
                

                const idxMap = this.commentsMap[postId]?.findIndex(c => c.tempId === tempId);
                if (idxMap !== -1) {
                    this.commentsMap[postId].splice(idxMap, 1);
                    this.commentsMap[postId].unshift(normalized);
                }                

                if (this.commentTotalMap[postId] !== undefined) {
                    this.commentTotalMap[postId]++;
                }
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'other.success_title'
                    ),
                    message:
                        this.translocoService.translate('news-feed.send_cmt'),
                    type: 'success',
                });
            },
            error: () => {
                this.commentOfNews = this.commentOfNews.filter(c => c.tempId !== tempId);
                this.commentsMap[postId] = this.commentsMap[postId]?.filter(c => c.tempId !== tempId);
                this._alertService.showAlert({
                    title: this.translocoService.translate(
                        'other.error_title'
                    ),
                    message:
                        this.translocoService.translate('errors.default'),
                    type: 'error',
                });
            }
        });


        // Reset input
        this.newComment = {
            content: '',
            parent: null
        };
    }

}   