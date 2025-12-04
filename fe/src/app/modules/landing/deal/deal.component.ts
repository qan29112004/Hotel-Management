import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoucherService } from 'app/core/admin/voucher/voucher.service';
import { Voucher } from 'app/core/admin/voucher/voucher.type';
import { UserService } from 'app/core/profile/user/user.service';
@Component({
  selector: 'app-deal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal.component.html',
  styleUrls:['./deal.component.scss']
})
export class DealComponent implements OnInit {
  vouchers: Voucher[] = [];
  activeVouchers: Voucher[] = [];
  user:any;
  loading = true; 

  constructor(private voucherService: VoucherService, private userService: UserService) {}

  ngOnInit(): void {
    this.loadVouchers();
    this.loadUser()
  }

  private loadUser(){
    this.userService.user$.subscribe({
      next: (res) => {
        this.user = res;  
        console.log('check user', this.user) // chỉ gán user khi API xong
        this.loading = false;
      },
      error: () => {
        this.user = null;
        this.loading = false;
      }
    })
  }

  private loadVouchers(): void {
    const payload = {
      page_size: 0,
      filterRules: [
        { field: 'status', option: 'contains', value: 'ACTIVE' },
        { field: 'requires_claim', option:'exact', value: true}
      ]
    };

    this.voucherService.getAllVoucher(payload).subscribe({
      next: (response) => {
        const now = new Date();
        this.vouchers = response.data || [];
        this.activeVouchers = this.vouchers.filter(v => {
          if (!v.expireAt) {
            return v.status === 'ACTIVE';
          }
          const expiresAt = new Date(v.expireAt);
          return v.status === 'ACTIVE' && expiresAt >= now;
        });
      },
      error: (err) => {
        console.error('Error loading vouchers for deals:', err);
        this.vouchers = [];
        this.activeVouchers = [];
      }
    });
  }

  getDisplayVouchers(): Voucher[] {
    return this.activeVouchers.slice(0, 6);
  }

  getDiscountLabel(voucher: Voucher): string {
    if (voucher.discountType === 'FIXED') {
      return `Giảm ${this.formatCurrency(voucher.discountValue)}`;
    }
    if (voucher.discountPercent) {
      return `Giảm ${voucher.discountPercent}%`;
    }
    return 'Ưu đãi đặc biệt';
  }

  getSubDiscountLabel(voucher: Voucher): string {
    if (voucher.discountType === 'PERCENT' && voucher.maxDiscountAmount) {
      return `Tối đa ${this.formatCurrency(voucher.maxDiscountAmount)}`;
    }
    return `Tối thiểu ${this.formatCurrency(voucher.minOrderValue)}`;
  }

  getDaysLeft(voucher: Voucher): string {
    if (!voucher.expireAt) {
      return 'Không giới hạn';
    }
    const now = new Date();
    const expire = new Date(voucher.expireAt);
    const diffMs = expire.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return 'Hết hạn hôm nay';
    }
    if (diffDays === 1) {
      return 'Hết hạn trong 1 ngày';
    }
    return `Hết hạn trong ${diffDays} ngày`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value || 0);
  }
}
