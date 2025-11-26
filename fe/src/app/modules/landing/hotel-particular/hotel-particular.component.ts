import { Component, OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, ViewChild, Renderer2, ElementRef, HostListener, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute, Route } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { MatCalendar, MatCalendarCellCssClasses, MatDatepicker } from '@angular/material/datepicker';
import { TranslocoService } from '@ngneat/transloco';
import { DateAdapter } from '@angular/material/core';
import { DateTime } from 'luxon';
import { RenderDayCellEventArgs } from '@syncfusion/ej2-angular-calendars';
import { CalendarComponent } from 'app/shared/components/calendar/calendar/calendar.component';
import { formatISODate, getCurrentDateString, parseDate, timeDate } from 'app/shared/utils/util';
import { register } from 'swiper/element/bundle';
import { RatingComponent } from 'app/shared/components/rating/rating.component';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { MapComponent } from 'app/shared/components/map/map.component';
import { environment } from 'environments/environment.fullstack';

@Component({
  selector: 'app-hotel-particular',
  standalone: true,
  imports: [CommonModule, SharedModule, CalendarComponent, RatingComponent, MapComponent],
  templateUrl: './hotel-particular.component.html',
  styleUrls:['./hotel-particular.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HotelParticularComponent implements OnDestroy, OnInit, OnChanges, DoCheck {
  baseUrl:string = environment.baseUrl;
  formatISODate=formatISODate;
  parseDate = parseDate;
  timeDate = timeDate;
  title = "star-angular";
  stars = [1, 2, 3, 4, 5];
  rating = 0;
  hoverState = 0;

  enter(i) {
    this.hoverState = i;
  }

  leave() {
    this.hoverState = 0;
  }

  updateRating(i) {
    this.rating = i;
  }
  @ViewChild('overview') overview:ElementRef;
  @ViewChild('images') images:ElementRef;
  @ViewChild('rooms') rooms:ElementRef;
  @ViewChild('reviews') reviews:ElementRef;
  @ViewChild('location') location:ElementRef;

  hotel_data:any;

  isRatingOverlayOpen:boolean = false;
  isFeatureAndServiceOverlayOpen:boolean = false;

  showCloseButton:boolean = false;

  crrHotel:string = 'fqrmuqqnqu' ;
  date:Date = new Date();
  getCurrentDateString = getCurrentDateString;
  listImageExploreHotel = [
    'assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg'
  ];

  isChangeRoomList:boolean;

  isHiddenForm:boolean = false;
  showCalendarCheckin = false; // Biến điều khiển hiển thị lịch
  showCalendarCheckout = false;
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
  private calendarSub: any;
  private _prevRoomListState: string = '';
  isAvailableRoom:boolean = true;
  hotel:any;
  private buttonListeners: (() => void)[] = [];
  @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
  @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;
  @ViewChild('calendarCheckin') calendarCheckin!: MatCalendar<Date>;
  calendarData = [
    { day: '2025-11-01', value: 'a' },
    { day: '2025-11-03', value: 'b' },
    { day: '2025-11-15', value: 'c' },
  ];
  
  constructor(public translocoService: TranslocoService, private datePipe: DatePipe, private renderer: Renderer2,private el: ElementRef,private dateAdapter: DateAdapter<any>, private route: Router, private activeRouter: ActivatedRoute,
    private hotelService:HotelService
  ){}
  //truyen vao calendar
  checkInDateObj: Date | null = null;
  checkOutDateObj: Date | null = null;
  //hien thi tren component
  get checkInDate(){
    return this.searchData.checkin;
  }

  set checkInDate(value:any){
    console.log('chay get check in')
    this.searchData.checkin = getCurrentDateString(value);
  }

  get checkOutDate(){
    return this.searchData.checkout;
  }

  set checkOutDate(value:any){
    this.searchData.checkout = getCurrentDateString(value);
  }

  ngOnInit(): void {
    this.activeRouter.queryParams.subscribe(param=>{
      console.log("parma:", param)
      this.searchData = { ...param };
      if(this.searchData.checkin && this.searchData.checkout){
        this.date = parseDate(this.searchData.checkin)
        this.checkOutDateObj = parseDate(this.searchData.checkout)
      }
      this.crrHotel = param['hotel']
      let i = 0;
      const rooms =[];
      while (true) {
        const adultsParam = param[`rooms[${i}][adults]`];
        const childrenParam = param[`rooms[${i}][children]`];

        if (adultsParam === undefined && childrenParam === undefined) break;

        rooms.push({
          adults: parseInt(adultsParam || '0', 10),
          children: parseInt(childrenParam || '0', 10),
        });
        i++;
      }
      this.roomList = rooms.length > 0 ? rooms : this.roomList;
      this.hotelService.getHotelById(this.crrHotel).subscribe(res=>{
        this.hotel_data = res.data;
        const payload = {
          checkin : this.searchData.checkin,
          checkout : this.searchData.checkout,
          hotel_id : this.hotel_data.uuid,
          rooms : this.roomList
        }
        if(this.searchData.checkin && this.searchData.checkout){
          this.hotelService.checkAvailableRoom(payload).subscribe(
            (res) => {
                console.log("Availability:", res);
                this.isAvailableRoom = res.status
            },
            (err) => {
                console.error("Error:", err);
            }
        );
      }
      })
      
    })
    register();
  }
  ngDoCheck(): void {
    const currentState = JSON.stringify(this.roomList);

    if (currentState !== this._prevRoomListState) {
      this._prevRoomListState = currentState;
      this.isChangeRoomList = true;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    // if(changes['roomList'] || changes['checkOutDate']){
    //   this.isChangeRoomList = true;
    //   console.log("check: ", this.isChangeRoomList)
    // }
  }

  ngAfterViewInit() {
    const buttons = this.el.nativeElement
   .querySelectorAll('.mat-calendar-previous-button, .mat-calendar-next-button');
      
   console.log("button: ", buttons)
    if (buttons) {
      Array.from(buttons).forEach(button => {
        this.renderer.listen(button, 'click', () => {
          alert('Arrow buttons clicked');
            console.log("active: ",this.calendarCheckin.activeDate);
        });
      });
    }
    ;
  }

  scrollTo(tag:string){
    const tagNavigate = {
      'overview':this.overview,
      'rooms':this.rooms,
      'location':this.location,
      'reviews':this.reviews,
      'images':this.images
    }
    tagNavigate[`${tag}`].nativeElement.scrollIntoView({behavior:'smooth', block:'center'})
  }

  openRatingOverlay() {
    this.isRatingOverlayOpen = true;
    this.renderer.addClass(document.body, 'overflow-hidden');  // Ngăn scroll toàn trang
  }
  // Đóng overlay và cho phép scroll body lại
  closeRatingOverlay() {
    this.isRatingOverlayOpen = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
  openFeatureAndServiceOverlay() {
    this.isFeatureAndServiceOverlayOpen = true;
    this.renderer.addClass(document.body, 'overflow-hidden');  // Ngăn scroll toàn trang
  }
  // Đóng overlay và cho phép scroll body lại
  closeFeatureAndServiceOverlay() {
    this.isFeatureAndServiceOverlayOpen = false;
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: Event) {
    const scrollY = window.scrollY || window.pageYOffset;

    if (scrollY === 0) {
      // Ở đầu trang
      this.isHiddenForm = false;
      this.showCloseButton = false;
    } else {
      // Khi scroll xuống
      this.isHiddenForm = true;
      this.showCloseButton = false;
    }
    
  }


  getCalendarValue(date: Date): string {
  const formatted = this.dateAdapter.format(date, 'yyyy-MM-dd');
  const match = this.calendarData.find(d => d.day === formatted);
    console.log(match)
  return match ? match.value : '';
}

  getDateClass = (date: Date): MatCalendarCellCssClasses => {
    const formatted = this.dateAdapter.format(date, 'yyyy-MM-dd');
    const match = this.calendarData.find(d => d.day === formatted);
    const className = match ? 'calendar-has-value' : '';

    // Chèn data-value (hơi hacky nhưng hoạt động)
    setTimeout(() => {
      const cell = document.querySelector(
        `.mat-calendar-body-cell[aria-label="${date.toDateString()}"] .mat-calendar-body-cell-content`
      ) as HTMLElement;
      if (cell && match) {
        cell.setAttribute('data-value', match.value);
      }
    });
    return className;
  };
  detachButtonListeners() {
    // Hủy tất cả các listener trước đó
    this.buttonListeners.forEach((listener) => listener());
    this.buttonListeners = [];
  }
  toggleGuestSelector() {
      this.showGuestSelector = !this.showGuestSelector;
  }
  closeGuestSelector() {
      this.showGuestSelector = false;
      if(this.isChangeRoomList === true){
        this.callAvailabilityAPI();
        this.isChangeRoomList = false;
      }
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
  toggleCalendarCheckin() {
      this.showCalendarCheckin = !this.showCalendarCheckin;
      
  }
  toggleCalendarCheckout() {
      this.showCalendarCheckout = !this.showCalendarCheckout;    
  }


  ngOnDestroy() {
    this.renderer.removeClass(document.body, 'overflow-hidden');
    this.calendarSub?.unsubscribe();
  }

  selectedCheckin(event: any) {
    console.log('Event:', event);
    console.log('instanceof Date?', event instanceof Date);
    console.log('typeof:', typeof event);

    if (event instanceof Date) {
        this.checkInDate = getCurrentDateString(event);
        console.log("this.checkindate: ", this.checkInDate)
        this.checkInDateObj =parseDate(this.checkInDate)
        this.checkOutDate = null;
        this.checkOutDateObj = this.checkInDateObj;
        console.log('chekout date', this.checkInDateObj)
        this.showCalendarCheckin = !this.showCalendarCheckin; 
    }else{
      this.checkInDate = null;
      this.checkOutDate = null;
      this.checkInDateObj = null;
        this.showCalendarCheckin = !this.showCalendarCheckin; 
    }

    console.log('checkInDate:', this.checkInDate);
}

  selectedCheckout(event:any){
    if (event instanceof Date) {
        this.checkOutDate = getCurrentDateString(event);
        this.showCalendarCheckout = !this.showCalendarCheckout; 
        this.callAvailabilityAPI();
    }else{
      this.checkOutDate = null;
        this.showCalendarCheckout = !this.showCalendarCheckout; 
    }
  }
  

  displayForm() {
    this.isHiddenForm = false;
    this.showCloseButton = true;
  }

  hideForm() {
    this.isHiddenForm = true;
    this.showCloseButton = false;
  }

  booking(){
    const queryParams: { [key: string]: any } = {};

    queryParams.uuid = this.hotel_data?.uuid
    queryParams.hotel = this.hotel_data?.name; // 🔹 thay dest bằng hotel
    queryParams.checkin = this.checkInDate;
    queryParams.checkout = this.checkOutDate;
    queryParams.code = '';

    this.roomList.forEach((room, i) => {
      queryParams[`rooms[${i}][adults]`] = room.adults;
      queryParams[`rooms[${i}][children]`] = room.children;
    });
    this.route.navigate(['booking'], {queryParams})
  }

  nextMonth(event:string){
    
  }
  prevMonth(event:string){
    
  }
  callAvailabilityAPI() {
    if (!this.checkInDate || !this.checkOutDate || !this.hotel_data) return;

    const payload = {
        checkin: this.checkInDate,
        checkout: this.checkOutDate,
        hotel_id: this.hotel_data?.uuid,
        rooms: this.roomList.map(r => ({
            adults: r.adults,
            children: r.children
        }))
    };

    console.log("CALL AVAIL API:", payload);

    this.hotelService.checkAvailableRoom(payload).subscribe(
        (res) => {
            console.log("Availability:", res);
            this.isAvailableRoom = res.status
        },
        (err) => {
            console.error("Error:", err);
        }
    );
}
}
