import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren, OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

import { register } from 'swiper/element/bundle';
import { environment } from 'environments/environment.fullstack';
import { formatDateToLong, calculateTotalAndAverage, convertVNDToUSD } from 'app/shared/utils/util';
import { BookingService } from 'app/core/booking/booking.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-select-rate',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './select-rate.component.html',
  styles: ``,
  animations: [
      trigger('slideToggle', [
        transition(':enter', [ // khi *ngIf thêm phần tử
          style({ height: 0, opacity: 0, overflow: 'hidden' }),
          animate('300ms ease-out', style({ height: '*', opacity: 1 }))
        ]),
        transition(':leave', [ // khi *ngIf xóa phần tử
          style({ height: '*', opacity: 1, overflow: 'hidden' }),
          animate('300ms ease-in', style({ height: 0, opacity: 0 }))
        ])
      ])
    ]
})
export class SelectRateComponent implements OnInit {
  @Input() list_room_selected:any;
  @Input() listRoomType:any[];
  @Input() roomIndex!: number;
  @Input() roomData: any;
  @Output() rateSelected = new EventEmitter<{ratePlanName:string, roomTypeName:string, totalPrice:number}>();
  selectedId:number = null;
  selectDetailRate: { id_rt: number; id_rate: number } | null = null;
  baseUrl:string = environment.baseUrl;
  formatDateToLong =formatDateToLong;
  calculateTotalAndAverage = calculateTotalAndAverage;
  convertVNDToUSD = convertVNDToUSD;
  @ViewChildren('swiperEl') swiperElements!: QueryList<ElementRef>;
  listImageExploreHotel = [
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg'],
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg']
  ];
  swipers: any[] = [];
  currentIndexes: number[] = [];

  constructor(private cdr: ChangeDetectorRef, private bookingService:BookingService) {
    
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
    }, 0);
    register();
  }

  initializeSwipers(swiperElements?: QueryList<ElementRef>, swipers?: any[] ,currentIndexes?: number[]) {
    if (!swiperElements || !swiperElements.length) return;
    console.log('Initializing swipers...', swiperElements);

    swiperElements.forEach((swiperElRef, index) => {
      const swiperEl = swiperElRef.nativeElement;

      // Reset index đầu
      currentIndexes[index] = 0;

      // Add event listeners
      swiperEl.addEventListener('swiperslidechange', (event: any) => {
        const swiperInstance = event.detail?.[0] || swiperEl.swiper;
        if (swiperInstance) {
          currentIndexes[index] = swiperInstance.realIndex;
          this.cdr.detectChanges();
        }
      });

      swiperEl.addEventListener('swiperinit', (e) => {
        swipers[index] = e.detail?.[0] || swiperEl.swiper;
        this.cdr.detectChanges();
        console.log(`Swiper ${index} initialized`, swipers[index]);
      });

      // Cấu hình
      Object.assign(swiperEl, {
        slidesPerView: 1,
        loop: true,
        speed: 300
      });

      swiperEl.initialize();
    });
  }

  prevSlide(index:number, swipers:any[]) {
    const swiper = swipers[index];
    if (swiper) swiper.slidePrev();
  }

  nextSlide(index:number, swipers:any[]) {
    console.log('next')
    const swiper = swipers[index];
    if (swiper) swiper.slideNext();
  }
  
  selectRate(roomtype_name:string, rate_name:string, total_price:string) {
    this.rateSelected.emit({
        ratePlanName: rate_name,
        roomTypeName: roomtype_name,
        totalPrice: parseFloat(total_price)
      });  }

  toggleDetail(id:number){
    this.selectedId = this.selectedId === id ? null : id;
  } 

  toggleDetailRate(id_rt:number, id_rate:number){
    if (this.selectDetailRate?.id_rt === id_rt && this.selectDetailRate?.id_rate === id_rate) {
      this.selectDetailRate = null; // bấm lại thì ẩn đi
    } else {
      this.selectDetailRate = { id_rt, id_rate }; // lưu cả index cha & con
    }
  } 

  selectRateToBooking(roomtype_name:string, rate_name:string, total_price:string){
    const payload = {
        "session_id":localStorage.getItem('session_id'),
        "room_type_name":roomtype_name,
        "rate_plan_name":rate_name,
        "user_email":"qan29112004@gmail.com",
        "total_price":total_price,
        "quantity":"1",
        "room_index":this.roomIndex
    }
    this.bookingService.createHoldRoom(payload).subscribe(
      res=>{
        if(res.ok){
          this.selectRate(rate_name, roomtype_name, total_price)
        }else{
          alert(`${res.error}`)
        }
      }
    )
  }

  isSelectedRate(){

  }
  
}
