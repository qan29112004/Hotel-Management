import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslocoService } from '@ngneat/transloco';

// Import interfaces từ product-management component
export interface Product {
    id: string;
    name: string;
    price: number;
    discount: number;
    category: Category;
    description: string;
    images: string[];
    location: string;
    contactPhone: string;
    status: Status;
    creator: string;
    createdAt: Date;
}

type Category =
    | 'Real Estate'
    | 'Vehicles'
    | 'Fashion'
    | 'Electronics'
    | 'Furniture';
type Status = 'In stock' | 'Out of stock';

interface CategoryOption {
    value: Category;
    label: string;
}

interface Creator {
    id: string;
    username: string;
    avatar?: string;
}

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-detail.component.html',
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
export class ProductDetailComponent implements OnInit {
    @Input() showProductDetail: boolean = false;
    @Input() selectedProduct: Product | null = null;
    @Input() categories: CategoryOption[] = [];
    @Input() creators: Creator[] = [];

    @Output() closeProductDetail = new EventEmitter<void>();
    @Output() editProduct = new EventEmitter<Product>();
    @Output() deleteProduct = new EventEmitter<string>();

    selectedMainImage: string | null = null;
    isDeleting: boolean = false;

    constructor(
        private datePipe: DatePipe,
        private translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        // Reset main image when modal opens
        this.selectedMainImage = null;
    }

    onCloseModal(): void {
        this.selectedMainImage = null;
        this.closeProductDetail.emit();
    }

    onEditProduct(): void {
        if (this.selectedProduct) {
            this.editProduct.emit(this.selectedProduct);
        }
    }

    onDeleteProduct(): void {
        if (this.selectedProduct) {
            this.isDeleting = true;
            // Simulate API call delay
            setTimeout(() => {
                this.deleteProduct.emit(this.selectedProduct!.id);
                this.isDeleting = false;
            }, 1000);
        }
    }

    selectMainImage(image: string): void {
        this.selectedMainImage = image;
    }

    onImageError(event: any): void {
        event.target.src = 'assets/images/products/default-product.svg';
    }

    // Utility methods
    formatDateTime(date: Date): string | null {
        return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm');
    }

    formatCurrency(amount: number): string {
        const lang = this.translocoService.getActiveLang();

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

    getCategoryClass(category: Category): string {
        const categoryClasses = {
            'Real Estate': 'bg-blue-100 text-blue-800',
            Vehicles: 'bg-green-100 text-green-800',
            Fashion: 'bg-pink-100 text-pink-800',
            Electronics: 'bg-purple-100 text-purple-800',
            Furniture: 'bg-orange-100 text-orange-800',
        };
        return categoryClasses[category] || 'bg-gray-100 text-gray-800';
    }

    getCategoryLabel(category: Category): string {
        return this.t(`product_management.category_${category}`);
    }

    getCreatorName(creatorId: string): string {
        const creator = this.creators.find((c) => c.id === creatorId);
        return creator?.username || creatorId;
    }

    getCreatorAvatar(creatorId: string): string {
        const creator = this.creators.find((c) => c.id === creatorId);
        return creator?.avatar || 'assets/images/avatars/default-avatar.svg';
    }

    t(key: string): string {
        return this.translocoService.translate(key);
    }
}
