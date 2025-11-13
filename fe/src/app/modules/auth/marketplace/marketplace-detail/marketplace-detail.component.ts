import { Component, EventEmitter, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { Product } from 'app/core/admin/market/product/product.type';
import { TranslocoModule } from '@ngneat/transloco';
import { UserService } from 'app/core/profile/user/user.service';
import { takeUntil, tap, Subject } from 'rxjs';

@Component({
  selector: 'app-marketplace-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule,TranslocoModule],
  templateUrl: './marketplace-detail.component.html',
  styles: ``
})
export class MarketplaceDetailComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter();
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  
  product: Product | null = null;
  user:any;
  

  private _userService = inject(UserService);
  private _destroy = new Subject();

  ngOnInit() {
    // this._userService.user$.pipe(
    //   tap(user=>{
    //     this.user = user;
    //     console.log("THÍ USSER: ", this.user);
    //   }),
    //   takeUntil(this._destroy)
    // ).subscribe();
    // Lấy thông tin sản phẩm từ route state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.product = navigation.extras.state['product'] as Product;
      this.user = navigation.extras.state['user']
      console.log('Product received:', this.product);
    } else {
      // Fallback: lấy từ history state
      const state = history.state;
      if (state && state.product && state.user) {
        this.product = state.product as Product;
        this.user = state.user;
        console.log('Product from history:', this.product);
      }
    }
    
    // Debug: log để kiểm tra
    console.log('Current product:', this.product);
  }

  closeDetail(){
    this.close.emit();
    this.router.navigate(['../'], { relativeTo:this.route});
  }

  ngOnDestroy(): void {
    this._destroy.next('');
    this._destroy.complete();
  }
}
