import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

@Component({
  selector: 'app-detail-voucher',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './detail-voucher.component.html',
  styleUrls:['../voucher.component.scss']
})
export class DetailVoucherComponent {
  @Input() claim: any;
  @Output() close = new EventEmitter<string>()
  getDiscountText(voucher:any): string {
    if (voucher.discountType === 'FIXED') {
      return `Giảm ${this.formatCurrency(voucher.discountValue)}`;
    } else {
      const maxDiscount = voucher.maxDiscountAmount 
        ? `Giảm tối đa ${this.formatCurrency(voucher.maxDiscountAmount)}`
        : '';
      return `Giảm ${voucher.discountPercent}% ${maxDiscount}`.trim();
    }
  }
  formatCurrency(amount: number): string {
    if(!amount){amount=0;}
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  }
  getUsagePercentage(claim: any): number {
    if (!claim.voucher.maxUsagePerUser || claim.voucher.maxUsagePerUser === 0) {
      return 0;
    }
    return Math.round((claim.voucher.totalUsed / claim.voucher.maxUsagePerUser) * 100);
  }
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  closeDetail(){
    this.close.emit('close')
  }
}
