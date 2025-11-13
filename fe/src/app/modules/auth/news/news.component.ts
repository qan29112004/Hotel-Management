import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'app/core/auth/auth.service';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'auth-news',
    standalone: true,
    imports: [
        CommonModule,
        CustomPaginationComponent,
        RouterModule,
        FormsModule
    ],
    templateUrl: './news.component.html',
    styleUrls: ['./news.component.scss']
})
export class NewsComponent implements OnInit {
    @ViewChild('categoryList') categoryList: ElementRef;
    categories_parent: any[] = [];
    categories_child: any[] = [];
    categories: any[] = [];
    news: any[] = [];
    likedUsers: any[] = [];
    selectedSlug: string | null = null;
    selectedParentSlug: string | null = null;
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

    // popup
    showLikedUsersPopup: boolean = false;

    // scroll
    showChevronLeft = false;
    showChevronRight = true;

    isImageLoading: boolean = false;
    imageError: boolean = false;


    handleImageLoad(event: Event) {
        this.isImageLoading = false;
        this.imageError = false;
    }

    handleImageError(event: Event) {
        this.isImageLoading = false;
        this.imageError = true;
    }



    constructor(
        private _authService: AuthService,
    ) { }


    ngOnInit() {
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
        this._authService.getNewsCategories(payload).subscribe(([categories_parent, totalNewsCategory]) => {
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

    
    toggleSearch(event: Event): void {
        event.stopPropagation();
        this.isSearching = !this.isSearching;
    }
    
    onSearchChange() {
        this.currentPage = 1;
        console.log('this.searchText', this.searchText);
        this.loadNews();
    }


    getCategoryNameById(id: number): string {
        const category = this.categories.find(c => c.id === id);
        return category ? category.name : id.toString();
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


    loadNews() {
        const payload = this.getPayload();
        console.log('payload', payload);
        this._authService.getAllNews(payload).subscribe(([news, totalNews]) => {
            // Xử lý news ở đây
            this.news = news;
            this.totalNews = totalNews;
            this.totalPages = Math.ceil(this.totalNews / this.pageSize);
        });
    }

    loadNewsByCategory(cat: any) {
        const payload = this.getPayload();
        this._authService.getNewsByCategory(cat.id, payload).subscribe(([news, totalNews]) => {
            this.news = news;
            this.totalNews = totalNews;
            this.totalPages = Math.ceil(this.totalNews / this.pageSize);
            console.log('this.totalNews', this.totalNews);
            console.log('this.totalPages', this.totalPages);
            console.log('this.pageSize', this.pageSize);
            console.log('this.news', this.news);
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
        console.log('this.sortField', this.sortField);
        console.log('this.sortOption', this.sortOption);
        this.loadNews();
    }


    getPayload() {
        const payload: any = {
            pageIndex: this.currentPage,
            pageSize: this.pageSize,
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
        return payload;
    }

    onHomeClick(event: Event) {
        event.preventDefault();
        this.currentPage = 1;
        this.selectedSlug = null;
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

}
