import { ChangeDetectorRef, Component, HostListener, ViewChild, OnInit, signal, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingState } from './booking.types';
import { SelectRateComponent } from './select-rate/select-rate.component';
import { SelectServiceComponent } from './select-service/select-service.component';
import { CustomerInfoComponent } from './customer-info/customer-info.component';
import { BookingProgressComponent } from './booking-progress/booking-progress.component';
import { TranslocoService } from '@ngneat/transloco';
import { CalendarComponent } from 'app/shared/components/calendar/calendar/calendar.component';
import { getCurrentDateString, parseDate } from 'app/shared/utils/util';
import { MatCalendar, MatDatepicker } from '@angular/material/datepicker';
import { SharedModule } from 'app/shared/shared.module';
import { BookingService } from 'app/core/booking/booking.service';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateRange, formatDateToLong } from 'app/shared/utils/util';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, SelectRateComponent, SelectServiceComponent, CustomerInfoComponent,BookingProgressComponent, CalendarComponent,SharedModule],
  templateUrl: './booking.component.html',
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
export class BookingComponent implements OnInit, OnChanges {
  bookingState: BookingState = {
    rooms: [
      { adults: 2, children: 1, selectedServices: [] },
      { adults: 1, children: 0, selectedServices: [] },
    ],
    currentRoomIndex: 0,
    currentStep: 'rate',
  };
  selectedId:number = null;

  isSmallScreen = false;
  showSecondDiv = false;
  crrHotel:string = 'fqrmuqqnqu' ;
  date = new Date();
  getCurrentDateString = getCurrentDateString;
  formatDateRange = formatDateRange;
  formatDateToLong = formatDateToLong;
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
  list_room_selected=[];

  listRoomType:any[] = null;
  payload:any;
  searchData:any;

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

  private calendarSub: any;
  private buttonListeners: (() => void)[] = [];
  @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
  @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;
  @ViewChild('calendarCheckin') calendarCheckin!: MatCalendar<Date>;

  constructor(private cdr: ChangeDetectorRef, public translocoService:TranslocoService,
    private bookingService : BookingService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    
  ) {}

  ngOnInit(): void {
    
    this.activeRoute.queryParams.subscribe(params=>{
      console.log("check params: ",params);
      this.searchData = { ...params };
      this.checkOutDateObj = parseDate(this.searchData.checkout)
      const rooms =[];
      let i = 0;
      while (true) {
        const adultsParam = params[`rooms[${i}][adults]`];
        const childrenParam = params[`rooms[${i}][children]`];

        if (adultsParam === undefined && childrenParam === undefined) break;

        rooms.push({
          adults: parseInt(adultsParam || '0', 10),
          children: parseInt(childrenParam || '0', 10),
        });
        i++;
      }
      this.bookingState.rooms = rooms;
      console.log("check room list:" , rooms)
      this.payload = {
          "hotel_name":params['hotel'],
          "checkin":params['checkin'],
          "checkout":params['checkout'],
          "requested_rooms":this.bookingState.rooms.length
      }
      this.bookingService.getAllRoomTypeSelectRoom({
          "check_in":this.payload['checkin'],
          "check_out":this.payload['checkout'],
          "hotel":this.payload['hotel_name'],
          "rooms":this.bookingState.rooms,
          "code":'',
          "index_room":this.bookingState.currentRoomIndex
      }).subscribe(res=>{
        this.listRoomType = res.data;
        console.log("check list rt:", this.listRoomType)
      })
      if(!localStorage.getItem('session_id')){
        this.bookingService.createSessionBooking(this.payload).subscribe(res=>{
          localStorage.setItem('session_id', res.data);
          
        })
      }else{
        this.bookingService.getListHoldRoom({"session_id":localStorage.getItem('session_id')}).subscribe(res=>{
          this.list_room_selected = res.data;
        })
      }
    })
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['bookingState.currentRoomIndex']){
      this.bookingService.getAllRoomTypeSelectRoom({
          "check_in":this.payload['checkin'],
          "check_out":this.payload['checkout'],
          "hotel":this.payload['hotel_name'],
          "rooms":this.bookingState.rooms,
          "code":'',
          "index_room":changes['bookingState.currentRoomIndex'].currentValue
      }).subscribe(res=>{
        this.listRoomType = res.data;
        console.log("check list rt:", this.listRoomType)
      })
    }
  }

  // Map step name → index (dùng cho slide animation)
  getStepIndex(step: 'rate' | 'service' | 'info'): number {
    return { rate: 0, service: 1, info: 2 }[step];
  }

  // Handler khi chọn rate xong
  onRateSelected(obj: any) {
    if(this.bookingState.currentRoomIndex +1 > this.list_room_selected.length ){
      this.list_room_selected.push(obj);
    }else{
      this.list_room_selected[this.bookingState.currentRoomIndex] = obj;
    }
    this.bookingState.currentStep = 'service';
    this.cdr.detectChanges();
  }

  // Handler khi chọn services xong
  onServicesSelected(selected: number[]) {
    this.bookingState.rooms[this.bookingState.currentRoomIndex].selectedServices = selected;

    if (this.bookingState.currentRoomIndex < this.bookingState.rooms.length - 1) {
      // còn phòng khác → quay lại bước rate của phòng tiếp theo
      this.bookingState.currentRoomIndex++;
      this.bookingState.currentStep = 'rate';
      this.cdr.detectChanges();
    } else {
      // hết phòng → sang bước nhập thông tin khách hàng
      this.bookingState.currentStep = 'info';
      this.cdr.detectChanges();
    }
  }

  // Handler khi submit thông tin khách hàng
  onSubmitBooking(info: any) {
    this.bookingState.customerInfo = info;
    console.log('Booking completed:', this.bookingState);
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
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }
  toggleGuestSelector() {
      this.showGuestSelector = !this.showGuestSelector;
  }
  closeGuestSelector() {
      this.showGuestSelector = false;
  }
  get guestSummary() {
      const totalAdults = this.bookingState.rooms.reduce((sum, r) => sum + r.adults, 0);
      const totalChildren = this.bookingState.rooms.reduce((sum, r) => sum + r.children, 0);
      const totalGuests = totalAdults + totalChildren;
      return `${this.bookingState.rooms.length} room${this.bookingState.rooms.length > 1 ? 's' : ''}${totalGuests >= 1 ? ', ' + totalGuests + ' guests' : ''}`;
  }

  removeRoom() {
      if (this.bookingState.rooms.length > 1) {
          this.bookingState.rooms.pop();
      }
  }
  addRoom() {
      if (this.bookingState.rooms.length < 5) { 
          this.bookingState.rooms.push({ adults: 1, children: 0, selectedServices: [] });
      }
  }

  toggleCalendarCheckin() {
      this.showCalendarCheckin = !this.showCalendarCheckin;
      
  }
  toggleCalendarCheckout() {
      this.showCalendarCheckout = !this.showCalendarCheckout;    
  }
  selectedCheckin(event:any){
    console.log(event)
    if (event instanceof Date) {
        this.checkInDate = getCurrentDateString(event);
        console.log("this.checkindate: ", this.checkInDate)
        this.checkInDateObj =parseDate(this.checkInDate)
        this.checkOutDate = null;
        this.checkOutDateObj = this.checkInDateObj;
        this.showCalendarCheckin = !this.showCalendarCheckin; 
    }else{
      this.checkInDate = null;
      this.checkOutDate = null;
      this.checkInDateObj = null;
        this.showCalendarCheckin = !this.showCalendarCheckin; 
    }
  }
  selectedCheckout(event:any){
    if (event instanceof Date) {
        this.checkOutDate = getCurrentDateString(event);
        this.showCalendarCheckout = !this.showCalendarCheckout; 
    }else{
      this.checkOutDate = null;
        this.showCalendarCheckout = !this.showCalendarCheckout; 
    } 
  }
  // Xử lý khi chọn ngày
  

  toggleDetail(id:number){
    this.selectedId = this.selectedId === id ? null : id;
  } 

  get totalBill(){
    const total_bill_vn = this.list_room_selected.reduce((acc, room) => acc + room.totalPrice, 0);
    const total_bill_usd = total_bill_vn/25000;
    return {total_bill_vn, total_bill_usd};
  }
}
