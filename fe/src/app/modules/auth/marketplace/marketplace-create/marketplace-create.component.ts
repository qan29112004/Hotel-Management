import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { ImagePreview, Article } from '../marketplace.types';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { ProductCategoryService } from 'app/core/admin/market/product-category/product-category.service';
import { map, switchMap,tap, Subject, takeUntil, take } from 'rxjs';
import { ProductCategory } from 'app/core/admin/market/product-category/product-category.types';
import { Router, ActivatedRoute, RouterOutlet, NavigationEnd } from '@angular/router';
import { ProductService } from 'app/core/admin/market/product/product.service';
import { User } from 'app/core/profile/user/user.types';
import { UserService } from 'app/core/profile/user/user.service';
import { FormsModule } from '@angular/forms';
import { formatPrice } from 'app/shared/utils/marketplace/format_price.util';

@Component({
  selector: 'app-marketplace-create',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslocoModule, RouterOutlet, FormsModule],
  templateUrl: './marketplace-create.component.html',
  styles: ``
})
export class MarketplaceCreateComponent implements OnInit, OnDestroy {
  private _alertService = inject(AlertService);
  private _translocoService = inject(TranslocoService);
  private _productCategoryService = inject(ProductCategoryService);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _destroy = new Subject();
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private _userService = inject(UserService);
  private _productService = inject(ProductService);
  user:User;
  selectCategory:number = 0;

  productCategory:ProductCategory[] = [];
  currentImageIndex: number = 0;
  
  inforArticle: Partial<Article> = {
    title: '',
    price: '',
    description: ''
  };
  isSwitchClick:boolean = false;
  imagePreview: ImagePreview[] = [];
  urlImage: string;
  @ViewChild('inputFile') inputFile:ElementRef<HTMLInputElement>;
  @ViewChild('inputPrice') inputPrice:ElementRef<HTMLInputElement>;
  @ViewChild('inputTitle') inputTitle:ElementRef<HTMLInputElement>;
  @ViewChild('inputDes') inputDes:ElementRef<HTMLInputElement>;
  
  ngOnInit(): void {
    // this._alertService.showAlert({
    //   title: 'Success',
    //   message: "thành công",
    //   type: 'success',
    // });
    this._productCategoryService.getProductCategories({}).pipe(
      map(([categories_parent, totalProductCategory])=>categories_parent),
      tap(res=>{
        this.productCategory = res;
      }),
      takeUntil(this._destroy)
    ).subscribe();
    
    // this._userService.user$.pipe(
    //   takeUntil(this._destroy)
    // ).subscribe(res=>{
    //   this.user = res;
    // })
    const state = history.state;
    if (state && state.user) {
      this.user = state.user;
      console.log("USER CREATE: ", this.user);
    } else {
      // Fallback: lấy từ UserService nếu không có state
      this._userService.user$.pipe(
        take(1),
        takeUntil(this._destroy)
      ).subscribe(user => {
        this.user = user;
        console.log("USER CREATE (fallback): ", this.user);
      });
    }
  }
  
  toggleSwitch(){
    this.isSwitchClick = !this.isSwitchClick;
  }

  changeInputDes(){
    this.inforArticle.description = this.inputDes.nativeElement.value;
  }

  changeInputPrice(){
    this.inforArticle.price = formatPrice(Number(this.inputPrice.nativeElement.value));
  }

  changeInputTitle(){
    this.inforArticle.title = this.inputTitle.nativeElement.value;
  }

  triggerInputFile(){
    this.inputFile.nativeElement.click();
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
    this.urlImage = this.imagePreview[index].previewUrl;
    console.log('Current image index updated to:', this.currentImageIndex);
    this._changeDetectorRef.detectChanges();
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.urlImage = this.imagePreview[this.currentImageIndex].previewUrl;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.imagePreview.length - 1) {
      this.currentImageIndex++;
      this.urlImage = this.imagePreview[this.currentImageIndex].previewUrl;
    }
  }

  removeSelectedFile(fileName: string) {
    console.log("XOA IMAGE:", fileName);
    const index = this.imagePreview.findIndex(item => item.fileName === fileName);
    if (index !== -1) {
      this.imagePreview.splice(index, 1);
      
      if (this.imagePreview.length > 0) {
        // Cập nhật currentImageIndex nếu ảnh bị xóa là ảnh hiện tại
        if (this.currentImageIndex >= this.imagePreview.length) {
          this.currentImageIndex = this.imagePreview.length - 1;
        }
        this.urlImage = this.imagePreview[this.currentImageIndex].previewUrl;
      } else {
        this.urlImage = ''; // Reset về rỗng nếu không còn ảnh
        this.currentImageIndex = 0;
      }
    }
  }

  inputChangeFile(event: Event){
    const input = event.target as HTMLInputElement;
    if(input.files){
      Array.from(input.files).forEach((file) => {
        if (file.type.startsWith('image/')) {

          const reader = new FileReader();
          reader.onload = (e: any) => {
            if (e.target.result) {
                this.imagePreview.push({
                    file: file,
                    fileName: file.name,
                    previewUrl: e.target.result
                });
            }
            if (this.imagePreview.length > 0) {
              // Nếu đây là ảnh đầu tiên, set làm ảnh hiện tại
              if (this.imagePreview.length === 1) {
                this.currentImageIndex = 0;
              }
              this.urlImage = this.imagePreview[this.currentImageIndex].previewUrl;
              console.log("URLIMAGE: ", this.urlImage);
            }
          };
          reader.readAsDataURL(file);}});
    }
    input.value='';
  }

  closeCreateProduct(){
    this._router.navigate(['/marketplace']);
  }


  createProduct(){
    const formData = new FormData();
    formData.append('name', this.inforArticle.title);
    formData.append('price', this.inputPrice.nativeElement.value);
    formData.append('describe', this.inforArticle.description);
    formData.append('created_by', this.user.id.toString());
    formData.append('category', this.selectCategory.toString());
    formData.append('product_status', 'in_stock');
    formData.append('status', 'Waiting');
    formData.append('location', this.user.address);
    formData.append('suplier', this.user.username);
    formData.append('discount', "0.12");
    formData.append('phone', this.user.phone);
    formData.append('img_files', this.imagePreview[0].file);
    this._productService.createProduct(formData).pipe(
      takeUntil(this._destroy)
    ).subscribe(res=>{
      console.log("RES: ", res);
    })
  }
  ngOnDestroy(): void {
    this._destroy.next('');
    this._destroy.complete()
  }
}
