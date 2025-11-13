import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

import { debounceTime, Subject } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertService } from 'app/core/alert/alert.service';

import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { TranslocoService } from '@ngneat/transloco';
// import { ProductAddComponent} from './product-add/product-add.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { Product , Category , createdBy } from 'app/core/admin/market/product/product.type';
import {ProductService} from 'app/core/admin/market/product/product.service';
import { products } from 'app/mock-api/apps/ecommerce/inventory/data';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseDrawerComponent } from '@fuse/components/drawer';



@Component({
    standalone: true,
    selector: 'app-product-management',
    imports: [
        SharedModule,
        MatTooltipModule,
        CustomPaginationComponent,
        ProductDetailComponent,
        FuseDrawerComponent,
    ],
    templateUrl: './product-management.component.html',
    styles: ``,
    encapsulation: ViewEncapsulation.None,
    animations: [
        trigger('fadeSlideIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px)' }),
                animate(
                    '200ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' })
                ),
            ]),
            transition(':leave', [
                animate(
                    '150ms ease-in',
                    style({ opacity: 0, transform: 'translateY(-10px)' })
                ),
            ]),
        ]),
    ],
})
export class ProductManagementComponent implements OnInit {
    //khai báo

    // Trạng thái tải dữ liệu
    isLoading: boolean = false;

    // Dữ liệu sản phẩm
    productList: Product[] = [];
    filteredProductList: Product[] = [];

    // Tìm kiếm
    searchValue: string = '';
    searchInputChanged: Subject<string> = new Subject<string>();

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // Phân trang
    totalRecords: number = 0;
    totalItems: number = 0;
    currentPage: number = 1;
    pageSize: number = 10;

    // Filters
    selectedCategory: Category | '' = '';
    selectedCreateBy: string = '';
    selectedStatus: | '' = '';

    // Show popup
    showEditProduct = false;
    showAddProduct = false;
    showProductDetail = false;
    showImport = false;
    selectedProduct: Product | null = null;

    // switch map
    // status
    statusMap: { [key: string]: string } = {
      'approved': 'Đã duyệt',
      'pending': 'Chờ duyệt',
      'rejected': 'Đã hủy'
    }
    constructor(
        private _alertService: AlertService,
        private datePipe: DatePipe,
        private translocoService: TranslocoService,
        private _productService: ProductService,
    ) {}

    ngOnInit(): void {
        this.loadData();
        this.searchInputChanged
            .pipe(debounceTime(500))
            .subscribe(() => this.reloadProducts());
    }

    

    // Tải dữ liệu
    loadData(): void {
        this.loadProducts();    
    }

    loadProducts(): void {
        this.isLoading = true;

        this._productService.getProducts().subscribe({
            next: ([products,total]) => {
                console.log('🧾 Product list:', products);
                this.productList = [...products]
                this.isLoading = false;
                this.totalRecords = total;
                this.applyFilters();
                this.applySorting();
                this.applyPagination();
                
            }
        })
         
    }

    reloadProducts(): void {
        this.currentPage = 1;
        this.loadProducts();
    }


    // Áp dụng filters
    applyFilters(): void {
        this.filteredProductList = this.productList.filter((product) => {
            // Search filter
            if (this.searchValue.trim()) {
                const searchLower = this.searchValue.toLowerCase();
                const matchesSearch = product.name
                    .toLowerCase()
                    .includes(searchLower);

                if (!matchesSearch) return false;
            }

            // Category filter
            console.log(this.selectedCategory);
            if (
                this.selectedCategory &&
                product.category !== this.selectedCategory
            ) {
                return false;
            }

            // Creator filter
            if (
                this.selectedCreateBy &&
                product.createdBy.id !== this.selectedCreateBy
            ) {
                return false;
            }

            // Status filter
            if (this.selectedStatus && product.status !== this.selectedStatus) {
                return false;
            }

            return true;
        });

        this.totalRecords = this.filteredProductList.length;
    }

    // Áp dụng sorting
    applySorting(): void {
        if (!this.sortField || !this.sortOption) return;

        this.filteredProductList.sort((a, b) => {
            let aValue: any = a[this.sortField as keyof Product];
            let bValue: any = b[this.sortField as keyof Product];

            if (this.sortField === 'created_at') {
                aValue = new Date(a.createdAt);
                bValue = new Date(b.createdAt);
            }

            if (aValue < bValue) {
                return this.sortOption === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return this.sortOption === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Áp dụng pagination
    applyPagination(): void {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.filteredProductList = this.filteredProductList.slice(
            startIndex,
            endIndex
        );
        this.totalItems = this.filteredProductList.length;
    }

    // Utility methods
    formatDateTime(date: Date): string | null {
        return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm');
    }

    formatCurrency(amount: number): string {
        const lang = this.translocoService.getActiveLang();

        // Mapping ngôn ngữ sang locale và currency
        const localeCurrencyMap = {
            vn: { locale: 'vi-VN', currency: 'VND', fractionDigits: 0 },
            en: { locale: 'en-US', currency: 'USD', fractionDigits: 2 },
        };

        const { locale, currency, fractionDigits } =
            localeCurrencyMap[lang] || localeCurrencyMap.en;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: fractionDigits,
        }).format(amount);
    }

    getFinalPrice(price: number, discount: number): number {
        return price - (price * discount) / 100;
    }

    getStatusName(status: string): string {
        return this.statusMap[status] || '---';
    }

   
    // Event handlers
    onSearchChange(): void {
        this.searchInputChanged.next(this.searchValue);
    }

    onCategoryChange(): void {
        this.reloadProducts();
    }

    onCreatorChange(): void {
        this.reloadProducts();
    }

    onStatusChange(): void {
        this.reloadProducts();
    }

    sortBy(field: string): void {
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
        this.loadProducts();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadProducts();
    }

    onPageSizeChange(size: number): void {
        this.pageSize = size;
        this.reloadProducts();
    }

    // Product actions
    toggleProductStatus(product: Product, event: any): void {
        product.productStatus = event.checked ? 'In stock' : 'Out of stock';

        // Here you would typically call an API to update the product status
    }

    viewProductDetail(product: Product): void {
        this.selectedProduct = product;
        this.showProductDetail = true;
    }

    toggleAddProductDrawer(open: boolean): void {
      this.showAddProduct = open;
    }


    toggleEditProductDrawer(product?: Product): void {
        if (product) {
            this.selectedProduct = product;
        }
        this.showEditProduct = !this.showEditProduct;
    }

    // Drawer event handlers
    drawerOpenedChanged(opened: boolean): void {
        this.showAddProduct = opened;
    }

    drawerOpenedChangedEdit(opened: boolean): void {
        this.showEditProduct = opened;
    }

    closeProductDetail(): void {
        this.showProductDetail = false;
        this.selectedProduct = null;
    }

    editProductFromDetail(product: Product): void {
        this.closeProductDetail();
        this.toggleEditProductDrawer(product);
    }

    deleteProductFromDetail(productId: string): void {
        this.closeProductDetail();
        this.reloadProducts();
    }

    // Track by function for performance
    trackByProductId(index: number, product: Product): string {
        return product.id;
    }
}

