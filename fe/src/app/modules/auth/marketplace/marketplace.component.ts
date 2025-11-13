import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MarketplaceDetailComponent } from './marketplace-detail/marketplace-detail.component';
import { Router, ActivatedRoute, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, Subscription, switchMap, tap, Subject, takeUntil } from 'rxjs';
import { ProductService } from 'app/core/admin/market/product/product.service';
import { Product } from 'app/core/admin/market/product/product.type';
import { environment } from 'environments/environment';
import { TranslocoModule } from '@ngneat/transloco';
import { UserService } from 'app/core/profile/user/user.service';
import { take } from 'lodash';
import { formatPrice } from 'app/shared/utils/marketplace/format_price.util';

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, MatIconModule, MarketplaceDetailComponent, RouterOutlet, TranslocoModule],
  templateUrl: './marketplace.component.html',
  styles: ``
})
export class MarketplaceComponent implements OnInit, OnDestroy {
  isOpenDetail:boolean;
  initialWidth = window.innerWidth;
  isOpenAdd :boolean;
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  hasChildRoute: boolean = false;
  listProduct: any[];
  baseUrl:string = environment.baseUrl;
  user:any;

  private _userService = inject(UserService);

  // Dữ liệu mẫu cho các sản phẩm hardcode
  sampleProducts = {
    'Iphone16-1': {
      name: 'Iphone 16',
      price: '1.000.000',
      image: 'assets/icons/marketplace/elegant-smartphone-composition.jpg',
      describe: 'iPhone 16 – phiên bản tiêu chuẩn mới nhất của Apple, sở hữu thiết kế tinh tế, chip A18 Bionic mạnh mẽ, màn hình Super Retina XDR 6.1 inch sắc nét và camera kép 48MP ấn tượng.'
    },
    'Iphone16-2': {
      name: 'Iphone 16',
      price: '1.000.000',
      image: 'assets/icons/marketplace/elegant-smartphone-composition.jpg',
      describe: 'iPhone 16 – phiên bản tiêu chuẩn mới nhất của Apple, sở hữu thiết kế tinh tế, chip A18 Bionic mạnh mẽ, màn hình Super Retina XDR 6.1 inch sắc nét và camera kép 48MP ấn tượng.'
    },
    'samsung-galaxy-s24-plus': {
      name: 'Samsung Galaxy S24 Plus 12GB 256GB',
      price: '16.790.000',
      image: 'assets/icons/marketplace/samsung-1.jpg',
      describe: 'Samsung Galaxy S24 Plus là một trong những siêu phẩm điện thoại đang làm mưa làm gió trong giới công nghệ hiện nay. Liệu chiếc flagship này có tốt không? Mức giá có tương xứng với có đắt không? Cùng tìm hiểu rõ hơn về thế hệ S24 Plus ngay dựa trên thông tin dưới đây.'
    },
    'xiaomi-1': {
      name: 'Xiaomi 14T Pro 12GB 512GB',
      price: '14.890.000',
      image: 'assets/icons/marketplace/xiaomi.jpg',
      describe: 'Xiaomi 14T Pro 12GB 512GB tích hợp chip Snapdragon 7s Gen 2 (8 nhân) mạnh mẽ, xử lý tác vụ mượt mà, thúc đẩy hiệu năng toàn diện. Camera chính 200 MP của Note 13 Series cho phép ghi lại hình ảnh vô cùng sắc nét, mang đến trải nghiệm chụp ảnh chi tiết và sống động. Viên pin lớn 5100 mAh giúp Redmi Note 13 Pro hoạt động bền bỉ suốt cả ngày, giảm thiểu tình trạng sạc nhiều lần.'
    },
    'macbook': {
      name: 'MacBook Air M2 (hoặc Pro)',
      price: '30.000.000',
      image: 'assets/icons/marketplace/macbook.jpg',
      describe: 'MacBook Air M2 với chip Apple M2 mạnh mẽ, màn hình Retina 13.6 inch, thời lượng pin lên đến 18 giờ. Laptop hoàn hảo cho công việc và giải trí.'
    },
    'oppo': {
      name: 'OPPO Reno14 5G 12GB 256GB',
      price: '15.700.000',
      image: 'assets/icons/marketplace/oppo.jpg',
      describe: 'OPPO Reno 14 sở hữu màn hình FHD+ 6.59 inch, tần số quét 120Hz, mang đến hình ảnh sống động và sắc nét cho người dùng. Dung lượng pin của máy đạt tới 6000mAh, hỗ trợ sử dụng cả ngày dài mà không lo gián đoạn. Camera trước có độ phân giải 50MP, hỗ trợ quay video 4K, mang đến chất lượng hình ảnh rõ nét trong nhiều điều kiện ánh sáng.'
    }
  };

  private _destroy = new Subject();
  private _productService = inject(ProductService);
  private _productSubscription: Subscription;
  
  ngOnInit() {
    this.initialWidth = window.innerWidth; 
    this.checkCurrentRoute();
    this._userService.user$.pipe(
      tap(user=>{
        this.user = user;
        console.log("THÍ USER: ", this.user)
      }),
      takeUntil(this._destroy)
    ).subscribe();
    this.getAllProduct();
    
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this._destroy)
    ).subscribe(() => {
      this.checkCurrentRoute();
      if(this._productSubscription){
        this._productSubscription.unsubscribe();
      }
      this.getAllProduct();
      
    });
  }
  
  ngOnDestroy() {
    this._destroy.next('');
    this._destroy.complete();
  }
  
  private checkCurrentRoute() {
    this.hasChildRoute = this.route.firstChild !== null;
  }

  getAllProduct(){
    this._productSubscription = this._productService.getProducts().pipe(
      tap(([products, total]) => {
        console.log("PRODUCT: ", products)
        this.listProduct = products.map((item:any)=>{
          if(item.discount){
            return {...item, realPrice: formatPrice(Number(item.price) - Number(item.price) * Number(item.discount)), price:formatPrice(item.price)};
          }
          return item;
        });
        this.listProduct = this.listProduct.sort((a, b) => {
          const highlightA = a.categoryInfor.highlight ? 0 : 1;
          const highlightB = b.categoryInfor.highlight ? 0 : 1;

          if (highlightA !== highlightB) {
            return highlightA - highlightB;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        console.log("PRODUCT FORMAT: ", this.listProduct)
      })
    ).subscribe();
  }

  openPopupDetail(crrProduct:Product){
    this.isOpenDetail = true;
    
    // Tìm sản phẩm từ listProduct hoặc sampleProducts
    // let product = this.listProduct?.find(item => item.id === slug);
    
    // if (!product && this.sampleProducts[slug]) {
    //   // Nếu không tìm thấy trong listProduct, lấy từ sampleProducts
    //   product = {
    //     id: slug,
    //     name: this.sampleProducts[slug].name,
    //     price: this.sampleProducts[slug].price,
    //     img: this.sampleProducts[slug].image,
    //     describe: this.sampleProducts[slug].describe
    //   } as any;
    // }
    
    // console.log('Product to navigate with:', product);
    // console.log('Slug:', slug);
    
    // Truyền thông tin sản phẩm qua route state
    console.log("CRR PRODUCT: ", crrProduct);
    this.router.navigate([crrProduct.name], { 
      relativeTo: this.route,
      state: { product: crrProduct, user:this.user }
    });
  }

  closePopupDetail(){
    this.isOpenDetail = false;
  }

  openPopupAdd(){
    this.isOpenAdd=true;
    this.router.navigate(['/marketplace',"create-marketplace"],{
      relativeTo: this.route,
      state: {user:this.user}
    });
  }

  closePopupAdd(){
    this.isOpenAdd= false;
  }

}
