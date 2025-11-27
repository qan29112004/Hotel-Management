import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VoucherService } from 'app/core/admin/voucher/voucher.service';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { FuseLoadingService } from '@fuse/services/loading';
import { DetailVoucherComponent } from './detail-voucher/detail-voucher.component';
interface VoucherClaim {
  uuid: string;
  voucher: {
    uuid: string;
    code: string;
    name: string;
    description?: string | null;
    discountType: string;
    discountValue: number;
    discountPercent?: number | null;
    maxDiscountAmount?: number | null;
    minOrderValue: number;
    startAt?: string | null;
    expireAt?: string | null;
    status: string;
    maxUsagePerUser: number;
    totalUsed: number;
    totalClaimed: number;
  };
  claimedAt: string;
  expiresAt?: string | null;
  usageCount: number;
  status: string;
  lastUsedAt?: string | null;
  metadata?: any;
}

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FuseLoadingBarComponent,DetailVoucherComponent],
  templateUrl: './voucher.component.html',
  styleUrls: ['./voucher.component.scss']
})
export class VoucherComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  claimChoose:any;
  // View state
  isHistoryView = false;
  currentTab = 'all';
  
  // Data
  activeClaims: VoucherClaim[] = [];
  expiredClaimsButVoucherValid: VoucherClaim[] = [];
  expiredVouchers: VoucherClaim[] = [];
  usedVouchers: VoucherClaim[] = [];
  
  // Loading states
  loading = false;
  reclaiming: { [key: string]: boolean } = {};
  
  // Voucher input
  voucherCode = '';
  
  constructor(
    private voucherService: VoucherService,
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: FuseLoadingService
  ) {}

  ngOnInit(): void {
    // Check query params for history view
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.isHistoryView = params['page'] === 'history';
        if (!this.isHistoryView) {
          this.loadMyVouchers();
        } else {
          this.loadHistoryVouchers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMyVouchers(): void {
    this.loadingService.show();
    this.voucherService.listMyVoucher()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const claims: VoucherClaim[] = response.data || [];
          console.log('claims', claims);
          this.categorizeVouchers(claims);
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading vouchers:', error);
          this.loadingService.hide();
        }
      });
  }

  loadHistoryVouchers(): void {
    this.loadingService.show();
    this.voucherService.listMyVoucher()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const claims: VoucherClaim[] = response.data || [];
          this.categorizeHistoryVouchers(claims);
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading history:', error);
          this.loadingService.hide();
        }
      });
  }

  categorizeVouchers(claims: VoucherClaim[]): void {
    const now = new Date();
    this.activeClaims = [];
    this.expiredClaimsButVoucherValid = [];

    claims.forEach(claim => {
      const claimExpired = claim.expiresAt ? new Date(claim.expiresAt) < now : false;
      const voucherExpired = claim.voucher.expireAt ? new Date(claim.voucher.expireAt) < now : false;
      const claimActive = claim.status === 'ACTIVE' && !claimExpired;
      const voucherActive = claim.voucher.status === 'ACTIVE' && !voucherExpired;

      if (claimActive && voucherActive) {
        // Claim còn hiệu lực và voucher còn hiệu lực
        this.activeClaims.push(claim);
      } else if (claimExpired && voucherActive) {
        // Claim hết hạn nhưng voucher vẫn còn hiệu lực
        this.expiredClaimsButVoucherValid.push(claim);
      }
    });
  }

  categorizeHistoryVouchers(claims: VoucherClaim[]): void {
    const now = new Date();
    this.expiredVouchers = [];
    this.usedVouchers = [];

    claims.forEach(claim => {
      const voucherExpired = claim.voucher.expireAt ? new Date(claim.voucher.expireAt) < now : false;
      const isUsed = claim.usageCount > 0;

      if (voucherExpired) {
        this.expiredVouchers.push(claim);
      } else if (isUsed) {
        this.usedVouchers.push(claim);
      }
    });
  }

  navigateToHistory(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 'history' }
    });
  }

  navigateToMain(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  reclaimVoucher(claim: VoucherClaim): void {
    if (this.reclaiming[claim.uuid]) return;
    
    this.reclaiming[claim.uuid] = true;
    this.voucherService.claimVoucher({ code: claim.voucher.code })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.reclaiming[claim.uuid] = false;
          this.loadMyVouchers();
        },
        error: (error) => {
          console.error('Error reclaiming voucher:', error);
          this.reclaiming[claim.uuid] = false;
          alert('Không thể claim lại voucher. Vui lòng thử lại.');
        }
      });
  }

  saveVoucherCode(): void {
    if (!this.voucherCode.trim()) {
      alert('Vui lòng nhập mã voucher');
      return;
    }

    this.voucherService.claimVoucher({ code: this.voucherCode.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.voucherCode = '';
          this.loadMyVouchers();
          alert('Claim voucher thành công!');
        },
        error: (error) => {
          console.error('Error claiming voucher:', error);
          const errorMsg = error?.error?.message || 'Không thể claim voucher. Vui lòng thử lại.';
          alert(errorMsg);
        }
      });
  }

  getDiscountText(voucher: VoucherClaim['voucher']): string {
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

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getUsagePercentage(claim: VoucherClaim): number {
    if (!claim.voucher.maxUsagePerUser || claim.voucher.maxUsagePerUser === 0) {
      return 0;
    }
    return Math.round((claim.voucher.totalUsed / claim.voucher.maxUsagePerUser) * 100);
  }

  isClaimExpired(claim: VoucherClaim): boolean {
    if (!claim.expiresAt) return false;
    return new Date(claim.expiresAt) < new Date();
  }

  isVoucherExpired(voucher: VoucherClaim['voucher']): boolean {
    if (!voucher.expireAt) return false;
    return new Date(voucher.expireAt) < new Date();
  }

  getVoucherTypeClass(voucher: VoucherClaim['voucher']): string {
    // Determine voucher type based on name or code
    const name = (voucher.name || '').toLowerCase();
    const code = (voucher.code || '').toLowerCase();
    
    if (name.includes('ship') || name.includes('freeship') || code.includes('ship')) {
      return 'free-ship';
    }
    if (name.includes('shopeepay') || code.includes('shopeepay')) {
      return 'shopeepay';
    }
    return '';
  }

  getActiveTabCount(): number {
    return this.activeClaims.length;
  }

  getExpiredTabCount(): number {
    return this.expiredClaimsButVoucherValid.length;
  }

  detailClaim(claim:any){
    this.claimChoose = claim
  }
  closeDetail(close:string){
    if(close === 'close'){
      this.claimChoose = undefined;
    }
  }
}
