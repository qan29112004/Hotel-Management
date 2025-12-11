import { ChangeDetectorRef, Component, HostListener, ViewChild, OnInit, signal, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingState } from './booking.types';
import { SelectRateComponent } from './select-rate/select-rate.component';
import { SelectServiceComponent } from './select-service/select-service.component';
import { CustomerInfoComponent } from './customer-info/customer-info.component';
import { BookingProgressComponent } from './booking-progress/booking-progress.component';
import { TranslocoService } from '@ngneat/transloco';
import { CalendarComponent } from 'app/shared/components/calendar/calendar/calendar.component';
import { formatSecondToMinute, getCurrentDateString, parseDate } from 'app/shared/utils/util';
import { MatCalendar, MatDatepicker } from '@angular/material/datepicker';
import { SharedModule } from 'app/shared/shared.module';
import { BookingService } from 'app/core/booking/booking.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { ActivatedRoute, Router } from '@angular/router';
import { formatDateRange, formatDateToLong } from 'app/shared/utils/util';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { filter, fromEvent, Subscription, switchMap, tap } from 'rxjs';
import { TranslocoModule } from '@ngneat/transloco';
import { DetailAmenityComponent } from './detail-amenity/detail-amenity.component';
import { ChatService } from 'app/core/chat/chat.service';
import { environment } from 'environments/environment.fullstack';
@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, SelectRateComponent, SelectServiceComponent, CustomerInfoComponent, BookingProgressComponent, DetailAmenityComponent, CalendarComponent, SharedModule, TranslocoModule],
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
    ]),
    trigger('slideToggleUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('300ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class BookingComponent implements OnInit, OnChanges {
  baseUrl: string = environment.baseUrl;
  bookingState: BookingState = {
    rooms: [
      { adults: 2, children: 1, selectedServices: [] },
      { adults: 1, children: 0, selectedServices: [] },
    ],
    currentRoomIndex: 0,
    currentStep: 'rate',
  };
  isOpenLayout: boolean = false;
  popupViewAmenity: boolean = false;
  chooseRoomType: any;
  selectedId: number = null;
  crrHotelData: any;
  isSmallScreen = false;
  showSecondDiv = false;
  crrHotel: string = 'fqrmuqqnqu';
  date = new Date();
  getCurrentDateString = getCurrentDateString;
  formatDateRange = formatDateRange;
  formatDateToLong = formatDateToLong;
  showCalendarCheckin = false; // Biến điều khiển hiển thị lịch
  showCalendarCheckout = false;

  today: Date = new Date();
  displayDate: string | null = null;
  showGuestSelector = false;
  adults: number = 1;
  children: number = 0;
  optionsDestinations: { id: string; name: string }[] = [];
  hasOptionDestinationLoaded: boolean = false;
  roomList = [
    { adults: 1, children: 0 }
  ];
  list_room_selected = [];
  ttl: any;
  listRoomType: any[] = null;
  payload: any;
  searchData: any;
  isChangeRoomList: boolean;
  originalCheckIn: string = null;
  originalCheckOut: string = null;

  //truyen vao calendar
  checkInDateObj: Date | null = null;
  checkOutDateObj: Date | null = null;
  private sessionExpiredSub!: Subscription;
  private sessionDeleteSub!: Subscription;
  totalBillObj: { total_bill_vn: number, total_bill_usd: number }
  //hien thi tren component
  get checkInDate() {
    return this.searchData.checkin;
  }

  set checkInDate(value: any) {
    console.log('chay get check in')
    this.searchData.checkin = getCurrentDateString(value);
  }

  get checkOutDate() {
    return this.searchData.checkout;
  }

  set checkOutDate(value: any) {
    this.searchData.checkout = getCurrentDateString(value);
  }

  private calendarSub: any;
  private _prevRoomListState: string = '';
  private buttonListeners: (() => void)[] = [];
  @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
  @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;
  @ViewChild('calendarCheckin') calendarCheckin!: MatCalendar<Date>;


  constructor(private cdr: ChangeDetectorRef, public translocoService: TranslocoService,
    private bookingService: BookingService,
    private activeRoute: ActivatedRoute,
    private route: Router,
    private hotelService: HotelService, private chatService: ChatService
  ) { }

  setCrrRoomIndex(index: number) {
    this.bookingState.currentRoomIndex = index
  }

  toggleLayout() {
    this.isOpenLayout = !this.isOpenLayout;
  }
  normalizeRooms(rooms) {
    return rooms
      .map(r => ({
        adults: r.adults,
        children: r.children
      }))
      .sort((a, b) => {
        // sắp xếp theo adults trước, rồi children
        if (a.adults !== b.adults) return a.adults - b.adults;
        return a.children - b.children;
      });
  }

  ngOnInit(): void {
    this.bookingService.ttl.subscribe(data => {
      console.log('check', data)
      this.ttl = formatSecondToMinute(data.ttl);
      setTimeout(() => {
        this.ttl = undefined;
      }, 3000)
    })
    this.sessionExpiredSub = fromEvent<CustomEvent>(window, 'session:expired')
      .subscribe(event => {
        console.log('Session expired:', event.detail.message);
        this.route.navigate(['/'])

      });

    this.activeRoute.queryParams.subscribe(params => {
      console.log("check params: ", params);
      this.searchData = { ...params };
      this.crrHotel = params['uuid']
      this.date = parseDate(this.searchData.checkin)
      this.checkOutDateObj = parseDate(this.searchData.checkout)
      // Lưu giá trị ban đầu của check-in và check-out
      this.originalCheckIn = params['checkin'];
      this.originalCheckOut = params['checkout'];
      const rooms = [];
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
      this.roomList = rooms;
      console.log("check room list:", rooms)
      this.getHotelDetail(this.crrHotel);
      this.payload = {
        'hotel_id': params['uuid'],
        "hotel_name": params['hotel'],
        "checkin": params['checkin'],
        "checkout": params['checkout'],
        "requested_rooms": this.bookingState.rooms.length,
        "session_id": localStorage.getItem("session_id") ? localStorage.getItem("session_id") : '',
        "booking_id": localStorage.getItem("booking_id") ? localStorage.getItem("booking_id") : ''
      }
      this.bookingService.getAllRoomTypeSelectRoom({
        check_in: this.payload['checkin'],
        check_out: this.payload['checkout'],
        hotel: this.payload['hotel_name'],
        rooms: this.bookingState.rooms,
        code: '',
        index_room: this.bookingState.currentRoomIndex,
        session_id: localStorage.getItem('session_id') || ''
      })
        .pipe(
          tap(res => {
            this.listRoomType = res.data;
            console.log("check list rt:", this.listRoomType);
          }),

          //  Nếu không có room type → dừng pipeline ngay
          filter(res => res.data && res.data.length > 0),

          //  Nếu có > 0 → gọi tiếp createSessionBooking
          switchMap(() =>
            this.bookingService.createSessionBooking(this.payload).pipe(
              tap(res => {
                localStorage.setItem('session_id', res.sessionId);
                localStorage.setItem('booking_id', res.bookingId);
              }),
              switchMap(res =>
                this.bookingService.getListHoldRoom({ session_id: res.sessionId })
              )
            )
          )
        )
        .subscribe(
          res => {
            this.list_room_selected = res.data;
            console.log("check list room selected:", this.list_room_selected);
          }
        );
    })

  }
  ngDoCheck(): void {
    const currentState = JSON.stringify(this.bookingState.rooms);

    if (currentState !== this._prevRoomListState) {
      this._prevRoomListState = currentState;
      this.bookingState.rooms = [...this.bookingState.rooms];
      this.isChangeRoomList = true;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookingState.currentRoomIndex']) {
      this.bookingService.getAllRoomTypeSelectRoom({
        "check_in": this.payload['checkin'],
        "check_out": this.payload['checkout'],
        "hotel": this.payload['hotel_name'],
        "rooms": this.bookingState.rooms,
        "code": '',
        "index_room": changes['bookingState.currentRoomIndex'].currentValue
      }).subscribe(res => {
        this.listRoomType = res.data;
        console.log("check list rt:", this.listRoomType)
      })
    }
  }

  getHotelDetail(hotelId: string) {
    this.hotelService.getDetailHotel(hotelId).subscribe(res => {
      this.crrHotelData = res.data;
    })
  }

  // Map step name → index (dùng cho slide animation)
  getStepIndex(step: 'rate' | 'service' | 'info'): number {
    return { rate: 0, service: 1, info: 2 }[step];
  }

  // Handler khi chọn rate xong
  onRateSelected(obj: any) {
    if (this.bookingState.currentRoomIndex + 1 > this.list_room_selected?.length) {
      this.list_room_selected.push(obj);
    } else {
      this.list_room_selected[this.bookingState.currentRoomIndex] = { ...this.list_room_selected[this.bookingState.currentRoomIndex], ...obj };
    }
    console.log("check condition:", this.list_room_selected, this.bookingState)
    this.bookingState.currentStep = 'service';
    this.cdr.detectChanges();
  }

  // Handler khi chọn services xong
  onServicesSelected(selected: any[]) {
    this.bookingState.rooms[this.bookingState.currentRoomIndex].selectedServices = selected;
    this.list_room_selected[this.bookingState.currentRoomIndex].services = selected;
    console.log("check after choose service:", this.bookingState)
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
  closePopup(isClose: boolean) {
    this.popupViewAmenity = false;
    this.chooseRoomType = null;
  }
  viewAmenity(rt: any) {
    this.popupViewAmenity = true;
    this.chooseRoomType = rt;
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

  changeAdults(index: number, delta: number) {
    this.bookingState.rooms = this.bookingState.rooms.map((room, idx) =>
      idx === index
        ? { ...room, adults: Math.max(1, room.adults + delta) }  // Tạo object mới
        : room
    );
  }

  changeChildren(index: number, delta: number) {
    this.bookingState.rooms = this.bookingState.rooms.map((room, idx) =>
      idx === index
        ? { ...room, children: Math.max(0, room.children + delta) }
        : room
    );
    // this.isChangeRoomList = true;
  }

  removeRoom() {
    if (this.bookingState.rooms.length > 1) {
      // this.bookingState.rooms.pop();
      this.bookingState.rooms = this.bookingState.rooms.slice(0, -1);
    }
  }
  addRoom() {
    if (this.bookingState.rooms.length < 5) {
      // this.bookingState.rooms.push({ adults: 1, children: 0 });
      this.bookingState.rooms = [...this.bookingState.rooms, { adults: 1, children: 0, selectedServices: [] }];
    }
  }

  toggleCalendarCheckin() {
    this.showCalendarCheckin = !this.showCalendarCheckin;

  }
  toggleCalendarCheckout() {
    this.showCalendarCheckout = !this.showCalendarCheckout;
  }
  selectedCheckin(event: any) {
    console.log(event)
    if (event instanceof Date) {
      this.checkInDate = getCurrentDateString(event);
      console.log("this.checkindate: ", this.checkInDate)
      this.checkInDateObj = parseDate(this.checkInDate)
      this.checkOutDate = null;
      this.checkOutDateObj = this.checkInDateObj;
      this.showCalendarCheckin = !this.showCalendarCheckin;
    } else {
      this.checkInDate = null;
      this.checkOutDate = null;
      this.checkInDateObj = null;
      this.showCalendarCheckin = !this.showCalendarCheckin;
    }
  }
  selectedCheckout(event: any) {
    if (event instanceof Date) {
      this.checkOutDate = getCurrentDateString(event);
      this.showCalendarCheckout = !this.showCalendarCheckout;
    } else {
      this.checkOutDate = null;
      this.showCalendarCheckout = !this.showCalendarCheckout;
    }
  }
  // Xử lý khi chọn ngày


  toggleDetail(id: number) {
    this.selectedId = this.selectedId === id ? null : id;
  }

  calculatorPriceAfterApplyVoucher(price: any) {
    console.log("check price discount: ", price)
    const total_bill_vn = price;
    const total_bill_usd = price / 25000;
    this.totalBillObj = { total_bill_vn, total_bill_usd };
  }

  get totalBill() {
    const total_bill_vn = this.list_room_selected.reduce((acc, room) => {
      const serviceTotal = room.services?.reduce((sAcc, sv) =>
        sAcc + Number(sv.price)
        , 0) || 0;

      return acc + Number(room.totalPrice) + serviceTotal;
    }, 0);
    const total_bill_usd = total_bill_vn / 25000;
    return { total_bill_vn, total_bill_usd };
  }
  booking() {
    const session_id = localStorage.getItem('session_id');
    const booking_id = localStorage.getItem('booking_id');
    const bookingRooms = this.bookingState.rooms.map(r => ({
      adults: r.adults,
      children: r.children,
    }));
    const normalized1 = this.normalizeRooms(this.roomList);
    const normalized2 = this.normalizeRooms(this.bookingState.rooms);
    const isSameRoom = JSON.stringify(normalized1) === JSON.stringify(normalized2);

    // Kiểm tra xem check-in và check-out có thay đổi hay không
    const isCheckInChanged = this.originalCheckIn !== this.checkInDate;
    const isCheckOutChanged = this.originalCheckOut !== this.checkOutDate;
    const isDateChanged = isCheckInChanged || isCheckOutChanged;

    if (session_id && booking_id && (!isSameRoom || isDateChanged)) {
      console.log("chay vao day - Room changed:", !isSameRoom, "Date changed:", isDateChanged)
      this.chatService.sendMessage(
        {
          action: 'delete_session',
          session_id: localStorage.getItem('session_id'),
          booking_id: localStorage.getItem('booking_id')
        }
      )
    } else {
      this.reloadPage();
    }
    this.sessionExpiredSub = fromEvent<CustomEvent>(window, 'session:delete')
      .subscribe(event => {
        console.log('Session expired:', event.detail.message);
        if (event.detail.status === true) {

          this.reloadPage();
        }
      });
  }

  reloadPage() {
    const queryParams: { [key: string]: any } = {};

    queryParams.uuid = this.payload?.hotel_id
    queryParams.hotel = this.payload?.hotel_name; // 🔹 thay dest bằng hotel
    queryParams.checkin = this.checkInDate;
    queryParams.checkout = this.checkOutDate;
    queryParams.code = '';

    // DEBUG: Log để kiểm tra giá trị
    console.log('🔍 DEBUG reloadPage:');
    console.log('  this.checkInDate:', this.checkInDate);
    console.log('  this.checkOutDate:', this.checkOutDate);
    console.log('  this.searchData.checkin:', this.searchData.checkin);
    console.log('  this.searchData.checkout:', this.searchData.checkout);
    console.log('  queryParams:', queryParams);

    this.bookingState.rooms.forEach((room, i) => {
      queryParams[`rooms[${i}][adults]`] = room.adults;
      queryParams[`rooms[${i}][children]`] = room.children;
    });
    this.route.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.route.navigate(['booking'], { queryParams });
    });
  }
  changeStep(step: 'rate' | 'service' | 'info') {
    this.bookingState.currentStep = step;
  }

}
