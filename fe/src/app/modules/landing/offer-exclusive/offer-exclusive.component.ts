import { Component, OnInit ,inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TranslocoModule} from '@ngneat/transloco';
import { TranslocoService } from '@ngneat/transloco';
import { OfferService } from 'app/core/admin/offer/offer.service';
import { environment } from 'environments/environment.fullstack';
import { OfferPopupComponent } from 'app/modules/auth/home-page/offer-popup/offer-popup.component';
@Component({
  selector: 'app-offer-exclusive',
  standalone: true,
  imports: [CommonModule,TranslocoModule, OfferPopupComponent],
  templateUrl: './offer-exclusive.component.html',
  styleUrls:['./offer-exclusive.component.scss']
})
export class OfferExclusiveComponent implements OnInit {
  baseUrl:string = environment.baseUrl;
  offer_bonus:any[];
  // Offer Popup Logic
  selectedOffer: any = null;
  selectedOfferImage: string = '';
  formattedOffers:any[] = [];
  listImageBonus = [
    'assets/images/offer/bonus_1.jpg',
    'assets/images/offer/bonus_2.jpg',
    'assets/images/offer/bonus_3.jpg'
  ]
  listImageOffer = [
    'assets/images/offer/bonus_1.jpg',
    'assets/images/offer/bonus_2.jpg',
    'assets/images/offer/bonus_3.jpg',
    'assets/images/offer/bonus_4.jpg',
    'assets/images/offer/bonus_5.jpg',
    'assets/images/offer/bonus_6.jpg',
    'assets/images/offer/bonus_7.jpg',
    'assets/images/offer/bonus_8.jpg',
    'assets/images/offer/bonus_9.jpg',
    'assets/images/offer/bonus_10.jpg',
  ]
  translocoService = inject(TranslocoService);
  offers = [];
  constructor(private offerService:OfferService){}
  ngOnInit(): void {
    this.loadAllOffer()
    this.offer_bonus =  this.translocoService.translate('offer.exclusive.bonus');
    this.formattedOffers = this.offer_bonus.map(offer => {
    const lines = offer.split('\n'); // tách theo xuống dòng
    return {
      firstLine: lines[0],
      otherLines: lines.slice(1).join('\n')
    };
  });
  }

  loadAllOffer(){
    if(this.offerService?.check().length > 0){
      this.offerService.offer$.subscribe(offer=>{
        this.offers = offer;
      })
    }else(
      this.offerService.getAllOffer({page_size:0}).subscribe(res=>{
        this.offers = res.data
      })
    )
  }
  openOfferPopup(offer: any, image: string) {
    this.selectedOffer = offer;
    this.selectedOfferImage = image;
  }
  closeOfferPopup() {
    this.selectedOffer = null;
    this.selectedOfferImage = '';
}

  getGridClass(i: number) {
    // Pattern mosaic lặp lại sau mỗi 6 item (dynamic)
    const mod = i % 8;
  
    switch (mod) {
      case 0:
        return 'col-span-6 row-span-2'; // item to
      case 1:
        return 'col-span-3 row-span-1';
      case 2:
        return 'col-span-3 row-span-1';
      case 3:
        return 'col-span-6 row-span-1'; // item to
      case 4:
        return 'col-span-3 row-span-1';
      case 5:
        return 'col-span-3 row-span-1';
      case 6:
        return 'col-span-6 row-span-2';
      default:
        return 'col-span-6 row-span-1';
      // default:
      //   return 'col-span-6 row-span-1';
    }
  }
}
