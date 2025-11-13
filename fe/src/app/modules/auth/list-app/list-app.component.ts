import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTypeService } from 'app/core/admin/app-type/app-type.service';
import { AppType } from 'app/core/admin/app-type/app-type.types';
import { NewsService } from 'app/core/admin/news/news.service';
import { forEach } from 'lodash';

@Component({
    selector: 'list-app',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        RouterModule,
        MatIconModule
    ],
    templateUrl: './list-app.component.html',
    styles: ``
})
export class ListAppComponent {
    constructor(
        private _appTypeService: AppTypeService,
        public translocoService: TranslocoService,
    ) {}


    appTypes: any[] = [];

    // Phân trang
    currentPage: number = 1;
    pageSize: number = 100;
    totalApps: number = 0;
    totalPages: number = 0;

    // industry
    industryOptions = this._appTypeService.getIndustry();

    isImageLoading = false;
    imageError = false;
    showImagePopup = false;
    imageUrl = '';

    ngOnInit(): void {
        this.loadApp();
    }

    getIndustry(industryId: number, key: string): string {
        const industry = this.industryOptions.find((s) => s.id === industryId);
        if (!industry) return '';
        return key === 'name' ? industry.name : industry.class;
    }

    loadApp(): void {
        this._appTypeService.getAppTypes().subscribe((appTypes) => {
            this.appTypes = appTypes;
        });
    }

    features = [
        { title: 'Đăng ký & Xác minh', icon: 'assets/icons/features/verify.png' },
        { title: 'Theo dõi khoản vay', icon: 'assets/icons/features/loan.png' },
        { title: 'Rút tiền & Thanh toán', icon: 'assets/icons/features/withdraw.png' },
        { title: 'Phân tích tài chính', icon: 'assets/icons/features/analysis.png' },
        { title: 'Giới thiệu & Hoàn tiền', icon: 'assets/icons/features/referral.png' },
        { title: 'Quản lý danh mục tài chính', icon: 'assets/icons/features/portfolio.png' },
        { title: 'Bảo hiểm rủi ro', icon: 'assets/icons/features/insurance.png' },
        { title: 'Hỗ trợ khách hàng', icon: 'assets/icons/features/support.png' },
        { title: 'Liên kết ngân hàng', icon: 'assets/icons/features/bank.png' },
        { title: 'Chấm điểm huy động vốn', icon: 'assets/icons/features/rating.png' },
        { title: 'Ký hợp đồng', icon: 'assets/icons/features/contract.png' },
        { title: 'Quản lý danh mục tài sản', icon: 'assets/icons/features/assets.png' },
    ];
      
}   