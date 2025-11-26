import { Component, ViewChild, ViewChildren, inject, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, ElementRef, AfterViewInit, ChangeDetectorRef, NgZone, HostListener, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { SharedModule } from 'app/shared/shared.module';
import { map } from 'rxjs';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { TranslocoService } from '@ngneat/transloco';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { MapComponent } from 'app/shared/components/map/map.component';
import { register } from 'swiper/element/bundle';
import { ActivatedRoute } from '@angular/router';
import { Hotel } from 'app/core/admin/hotel/hotel.types';
import { environment } from 'environments/environment.fullstack';
import { formatDateRange, getCurrentDateString } from 'app/shared/utils/util';

@Component({
  selector: 'app-explore-hotel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MapComponent,
    SharedModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './explore-hotel.component.html',
  styleUrls:['./explore-hotel.component.scss']
})
export class ExploreHotelComponent implements OnInit, OnDestroy, AfterViewInit {
   limit:number = 2;
   offset:number = 0;
   total:number = 0;
   next:string;
   previous:string;
  buttonNext:boolean = true;
  sort:string;
  formatDateRange=formatDateRange;
  Math = Math;
  showCalendar = false; // Biến điều khiển hiển thị lịch
  selectedDateCheckin: Date | null = null; // Lưu ngày được chọn
  selectedDateCheckout: Date | null = null;
  today:Date = new Date();
  displayDate: string | null = null;
  showGuestSelector = false;
  adults:number = 1;
  children:number = 0;
  optionsDestinations: { id: string; name: string }[] = [];
  hasOptionDestinationLoaded:boolean = false;
  roomList = [
      {adults:1, children:0}
  ];
  searchData:any;
  baseUrl:string = environment.baseUrl;
  isSmallScreen = false;
  showSecondDiv = false;
  listHotel:Hotel[] = [];
  listExcludeHotel:Hotel[] = [];
  crrImage:string = '';
  private intervalId: any;
  swipers: any[] = [];
  currentIndexes: number[] = [];
  swipers2: any[] = [];
  currentIndexes2: number[] = [];
  @ViewChildren('swiperEl') swiperElements!: QueryList<ElementRef>;
  @ViewChildren('swiperE2') swiperElements2!: QueryList<ElementRef>;
  @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
  @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;
  @ViewChild('headerRef') headerRef!: ElementRef;
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  headerHeight = 0;
  private resizeObserver!: ResizeObserver;
  destinationService = inject(DestinationService);
  translocoService = inject(TranslocoService);
  hotelService = inject(HotelService);
  isOpenFilter:boolean = false;
  isHidden:boolean = false;
  listImageExploreHotel = [
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg'],
    ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg']
  ];
  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone, private activeRoute: ActivatedRoute, private router: Router) {}

  get checkInDate(){
    return this.searchData.check_in;
  }

  set checkInDate(value:any){
    console.log('chay get check in')
    this.searchData.check_in = getCurrentDateString(value);
  }

  get checkOutDate(){
    return this.searchData.check_out;
  }

  set checkOutDate(value:any){
    this.searchData.check_out = getCurrentDateString(value);
  }

  ngOnInit(): void {
    if(this.destinationService.check()?.data?.length > 0){
      this.destinationService.destinations$.pipe(
        map(destinations => {
              return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
          })
      ).subscribe(res =>{
        this.optionsDestinations = res;
      })
    }else{
      this.destinationService.getDestinations().pipe(
          map(destinations => {
              return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
          }
      )
      ).subscribe((res) => {
          this.optionsDestinations = res;
          console.log('Destinations options: ', res);
      });}
    

    this.activeRoute.data.subscribe(data =>{
      this.listHotel = data['hotel']?.apiData?.data.data;
      this.searchData = data['hotel']?.searchData;
      this.total = data['hotel']?.apiData?.data.total;
      this.next = data['hotel']?.apiData?.data.next;
      this.previous = data['hotel']?.apiData?.data.previous;
      this.roomList = data['hotel']?.searchData.rooms;
      this.listExcludeHotel = data['hotel']?.apiData?.data.excludeHotel;
      console.log("data['hotel']", data['hotel'])
      console.log("this.listExcludeHotel", this.listExcludeHotel)
      console.log("this listhotel: ", this.listHotel);
      this.buttonNext = !!(this.next && this.next.trim());
      console.log("this.next", this.next)
      console.log("this.buttonNex", this.buttonNext)
      setTimeout(() => {
          this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
          this.initializeSwipers(this.swiperElements2,this.swipers2, this.currentIndexes2);
        }, 0);
    })
    register();
    this.checkScreenSize();
    this.updateImageExplore();
    this.intervalId = setInterval(() => this.updateImageExplore(), 60 * 1000);
  }

  ngOnDestroy(): void {
      clearInterval(this.intervalId);
  }
  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    this.resizeObserver = new ResizeObserver(() => {
      this.updateHeaderHeight();
    });
    this.resizeObserver.observe(this.headerRef.nativeElement);
    this.updateHeaderHeight();
    this.checkMapVisibility();

    
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


  updateImageExplore(){
    this.crrImage = this.hotelService.getCurrentImageExplore()
  }

  submitSearch() {
    this.searchData.offset = 0;
    console.log("seardata",this.searchData)
    const queryParams: { [key: string]: any } = {};
    queryParams.dest = this.searchData.destination;
    queryParams.checkin = this.searchData.check_in;
    queryParams.checkout = this.searchData.check_out;
    queryParams.code = this.searchData.code;
    this.roomList.forEach((room, i) => {
        queryParams[`rooms[${i}][adults]`] = room.adults;
        queryParams[`rooms[${i}][children]`] = room.children;
    });
    this.router.navigate(['/explore-hotels'], { queryParams });
    this.hotelService.getExploreHotels(this.searchData).subscribe(res=>{
      this.listHotel = res.data.data;
      console.log('this list hotel load more', this.listHotel)
      this.next = res.data?.next;
      this.total = res.data?.total;
      this.previous = res.data?.previous;
      this.listExcludeHotel = res.data?.excludeHotel;
      this.buttonNext = !!(this.next && this.next.trim());
      console.log("this.buttonNex", this.buttonNext)
      setTimeout(() => {
          this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
          this.initializeSwipers(this.swiperElements2,this.swipers2, this.currentIndexes2);
        }, 0);
    }
    )
  }
  
  toggleCalendarCheckin() {
      setTimeout(() => {
          if (this.pickerCheckin) {
              this.pickerCheckin.open();  // Gọi open() trên instance
          }
      });
      
  }
  toggleCalendarCheckout() {
      setTimeout(() => {
          if (this.pickerCheckout) {
              this.pickerCheckout.open();  // Gọi open() trên instance
          }
      });
      
  }

  // Xử lý khi chọn ngày
  onDateChange(event: any) {
      this.selectedDateCheckin = event.value;
  }

  toggleGuestSelector() {
      this.showGuestSelector = !this.showGuestSelector;
  }

  closeGuestSelector() {
    this.searchData.rooms = [...this.roomList]
      this.showGuestSelector = false;
  }

  get guestSummary() {
      const totalAdults = this.roomList.reduce((sum, r) => sum + r.adults, 0);
      const totalChildren = this.roomList.reduce((sum, r) => sum + r.children, 0);
      const totalGuests = totalAdults + totalChildren;
      return `${this.roomList.length} room${this.roomList.length > 1 ? 's' : ''}${totalGuests >= 1 ? ', ' + totalGuests + ' guests' : ''}`;
  }

  removeRoom() {
      if (this.roomList.length > 1) {
          this.roomList.pop();
      }
  }
  addRoom() {
      if (this.roomList.length < 5) { 
          this.roomList.push({ adults: 1, children: 0 });
      }
  }
  get minCheckoutDate(): Date | null {
        if (!this.selectedDateCheckin) return null;
        const date = new Date(this.selectedDateCheckin);
        date.setDate(date.getDate() + 1);
        return date;
    }
  private updateHeaderHeight() {
    this.headerHeight = this.headerRef.nativeElement.offsetHeight;
    console.log(this.headerHeight)
  }

  @HostListener('window:scroll')
  onScroll() {
    this.checkMapVisibility();
  }

  private checkMapVisibility() {
    if (!this.mapContainer) return;

    const rect = this.mapContainer.nativeElement.getBoundingClientRect();
    const triggerPoint = this.headerHeight + 52.2;

    // Nếu top của mapContainer <= triggerPoint → ẩn
    this.isHidden = rect.top <= triggerPoint;

    console.log("SCROLL: ", this.isHidden)
  }
  // Lắng nghe khi resize cửa sổ
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth <= 1280;
    // Nếu là màn hình nhỏ thì mặc định hiện div2, ẩn div1
    if (this.isSmallScreen) {
      this.showSecondDiv = true;
    } else {
      // Ở màn lớn thì luôn hiển thị div1
      this.showSecondDiv = false;
    }
  }

  toggleToDiv1() {
    // Chỉ hoạt động khi max-lg
    if (this.isSmallScreen) {
      this.showSecondDiv = false;
    }
  }

  toggleToDiv2() {
    if (this.isSmallScreen) {
      this.showSecondDiv = true;
    }
  }

  loadMoreHotes(){
    this.searchData.offset = this.searchData.limit + this.searchData.offset;
    this.hotelService.getExploreHotels(this.searchData, this.next).subscribe(res=>{
      this.listHotel = [...this.listHotel,...res.data.data];
      console.log('this list hotel load more', this.listHotel)
      this.next = res.data?.next;
      this.previous = res.data?.previous;
      this.listExcludeHotel = [...this.listExcludeHotel,...res.data?.excludeHotel];
      this.buttonNext = !!(this.next && this.next.trim());
    }
    )
  }
  onSortChange(event: any) {
    const sortValue = event.target.value;
    this.searchData['sort'] = sortValue

    this.hotelService.getExploreHotels(this.searchData).subscribe(res=>{
      this.listHotel = res.data.data;
      console.log('this list hotel load more', this.listHotel)
      this.next = res.data?.next;
      this.total = res.data?.total;
      this.previous = res.data?.previous;
      this.listExcludeHotel = res.data?.excludeHotel;
      this.buttonNext = !!(this.next && this.next.trim());
      console.log("this.buttonNex", this.buttonNext)
      setTimeout(() => {
          this.initializeSwipers(this.swiperElements,this.swipers, this.currentIndexes);
          this.initializeSwipers(this.swiperElements2,this.swipers2, this.currentIndexes2);
        }, 0);
    }
    )  // 👈 gọi API với sort
  }
  chooseHotel(slug:string, uuid:string){
    const queryParams: { [key: string]: any } = {};
    queryParams.hotel = uuid;
    queryParams.checkin = this.searchData.check_in;
    queryParams.checkout = this.searchData.check_out;
    queryParams.code = this.searchData.code;
    this.roomList.forEach((room, i) => {
        queryParams[`rooms[${i}][adults]`] = room.adults;
        queryParams[`rooms[${i}][children]`] = room.children;
    });
    this.router.navigate([`hotel/${slug}`], {queryParams})
  }
}
