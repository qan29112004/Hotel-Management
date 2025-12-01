import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingService } from 'app/core/admin/rating/rating.service';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { UserService } from 'app/core/profile/user/user.service';
import { environment } from 'environments/environment.fullstack';
import { SharedModule } from 'app/shared/shared.module';
import { animate, style, transition, trigger } from '@angular/animations';
import { RatingComponent } from 'app/shared/components/rating/rating.component';
import { formatISODate } from 'app/shared/utils/util';
import { FormBuilder, FormGroup, Validator, Validators, FormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { Subject, pipe, map, takeUntil } from 'rxjs';
import { result, take } from 'lodash';
import { formatDate } from 'app/shared/utils/util';
import { Router } from '@angular/router';
import { BookingService as PaymentService } from 'app/core/booking/booking.service';
declare var paypal: any;

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, SharedModule, RatingComponent, FormsModule,MatDatepickerModule],
  templateUrl: './my-booking.component.html',
  styles: `
    /* Custom scrollbar for the hotel dropdown */
    .hotel-dropdown::-webkit-scrollbar {
      width: 6px;
    }
    .hotel-dropdown::-webkit-scrollbar-track {
      background: #f1f1f1; 
    }
    .hotel-dropdown::-webkit-scrollbar-thumb {
      background: #000; 
    }
    .hotel-dropdown::-webkit-scrollbar-thumb:hover {
      background: #333; 
    }
  `,
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
export class MyBookingComponent implements OnInit, AfterViewInit {
  formatISODate=formatISODate;
  title = "star-angular";
  stars = [1, 2, 3, 4, 5];
  rating = 0;
  hoverState = 0;
  today = new Date();
  private $destroy = new Subject();
  bookingId:string;

  @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
  @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;
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
  // Filter & Sort State
  filterCheckIn: Date;
  filterCheckOut: Date;
  filterHotelName: string = '';
  filterStatus:string = '';
  hotelSearchQuery: string = '';
  showHotelDropdown: boolean = false;
  sortPrice: 'asc' | 'desc' | '' = '';

  // Hardcoded Hotel Data for Filter
  availableHotels = [
    { id: '1', name: 'Luxury Hotel Saigon' },
    { id: '2', name: 'The Grand Hanoi' },
    { id: '3', name: 'Danang Beach Resort' },
    { id: '4', name: 'Rex Hotel' },
    { id: '5', name: 'Metropole Legend' },
    { id: '6', name: 'Majestic Saigon' },
  ];

  enter(i) {
    this.hoverState = i;
  }

  leave() {
    this.hoverState = 0;
  }

  updateRating(i) {
    this.rating = i;
    this.ratingForm.get('rating').setValue(this.rating)
  }
  payload:any={
    review:"rating 1",
    rating:5,
    hotel:"fqrmuqqnqu",
    booking:"fwgypxnxhl",
    subject:"subject"
  }
  lastFilters = {
    checkIn: null,
    checkOut: null,
    hotelName: '',
    sortPrice: null,
    status:''
  };

  selectDetailRoom: { id_bk: number; id_room: number } | null = null;
  crrUser:any;
  filter:any[]=[];
  baseUrl:string = environment.baseUrl; 
  myBooking:any[] = [];
  ratingForm:FormGroup;
  refundInfo: { [key: string]: any } = {};
  refundLoading: { [key: string]: boolean } = {};
  retryLoading: { [key: string]: boolean } = {};
  
  constructor(private fb: FormBuilder,private ratingService:RatingService, private bookingService:BookingService, private userService:UserService, private hotelService: HotelService, private router:Router, private paymentService: PaymentService) {
    
  }

  ngOnInit(): void {
    this.userService.user$.subscribe(user=>{
      this.crrUser=user;
      if(user?.email) {
        this.getMyBooking(user.email)
      }
    })
    this.loadAllHotel();
    this.ratingForm = this.fb.group({
        subject:['', Validators.required],
        review:['', Validators.required],
        rating:[0, Validators.required]
      })
  }

  getMyBooking(email:string){
    this.filter = []; // Reset filter base
    this.filter.push({
      field:'user_email',
      option:'contains',
      value:email
    })
    this.bookingService.getMyBooking({page_size:0, filterRules:this.filter}).subscribe(bookings=>{
      console.log('mybooking:',bookings)
      this.myBooking = bookings.data;
    })
  }

  loadAllHotel(){
    if(this.hotelService.getHotelData.length >0){
      this.hotelService.hotel$.pipe(
        map(res=>{
          this.availableHotels = res.map(item=>({
            id:item.uuid,
            name:item.name
          }))
        }),
        takeUntil(this.$destroy)
      ).subscribe()
    }else{
      this.hotelService.getAllHotels({page_size:0}).pipe(
        map(res=>{
          this.availableHotels = res.data.map(item=>({
            id:item.uuid,
            name:item.name
          }))
        }),
        takeUntil(this.$destroy)
      ).subscribe()
    }
  }
  // --- Filtering & Sorting Logic ---

  get filteredHotels() {
    return this.availableHotels.filter(h => 
      h.name.toLowerCase().includes(this.hotelSearchQuery.toLowerCase())
    );
  }

  selectHotel(name: string) {
    this.filterHotelName = name;
    this.hotelSearchQuery = name;
    this.showHotelDropdown = false;
  }

  calculateTotalPrice(booking: any): number {
    return booking.bookingRoom.reduce((sum, room) => sum + (room.price || 0), 0);
  }

  get filteredBookings() {
    let result = this.myBooking || [];
    return result;
  }

  filterHotel(){
    console.log("check ngmodel: ", this.filterStatus)
    console.log("compare", this.filterStatus === this.lastFilters.status, "..", this.lastFilters.status)
    const noChange =
    this.filterCheckIn === this.lastFilters.checkIn &&
    this.filterCheckOut === this.lastFilters.checkOut &&
    this.filterHotelName === this.lastFilters.hotelName &&
    this.sortPrice === this.lastFilters.sortPrice &&
    this.filterStatus === this.lastFilters.status
    
    console.log("check nocahnge: ", noChange)
    if (noChange) {
      console.log("⚠ Không có thay đổi → Không gọi API");
      return;
    }

    // --- 2) Update lại giá trị để lần sau so sánh ---
    this.lastFilters = {
      checkIn: this.filterCheckIn,
      checkOut: this.filterCheckOut,
      hotelName: this.filterHotelName,
      sortPrice: this.sortPrice,
      status: this.filterStatus
    };

    // --- 3) Chuẩn bị filterRules nhưng chỉ thêm rule có value ---
    const rules = [];

    if (this.filterCheckOut) {
      rules.push({
        field: "check_in",
        option: "lte",
        value: formatDate(this.filterCheckOut)
      });
    }

    if (this.filterHotelName) {
      rules.push({
        field: "hotel_id__name",
        option: "contains",
        value: this.filterHotelName
      });
    }

    if (this.filterCheckIn) {
      rules.push({
        field: "check_out",
        option: "gte",
        value: formatDate(this.filterCheckIn)
      });
    }
    if (this.filterStatus) {
      rules.push({
        field: "status",
        option: "contains",
        value: this.filterStatus
      });
    }

    // --- 5) Tạo sortRule (chỉ thêm nếu có sortPrice) ---
    const sortRule = this.sortPrice
      ? {
          field: "total_price",
          option: this.sortPrice
        }
      : null;


    // --- 7) Gọi API ---
    this.bookingService
      .getMyBooking({
        filterRules: rules,
        sortRule: sortRule
      })
      .subscribe((res) => {
        this.myBooking = res.data;
      });
  }

  toggleHotelDropdown() {
    this.showHotelDropdown = !this.showHotelDropdown;
  }

  closeHotelDropdown() {
    // Small delay to allow click event to register on items
    setTimeout(() => {
        this.showHotelDropdown = false;
    }, 200);
  }

  // --- End Filtering Logic ---

  createRating(bookingId:string, hotelId:string){
    if(this.ratingForm.invalid)return;
    this.payload.review = this.ratingForm.get('review').value;
    this.payload.rating = this.ratingForm.get('rating').value;
    this.payload.hotel = hotelId;
    this.payload.booking = bookingId;
    this.ratingService.createRating(this.payload).subscribe(
      res =>{
        console.log("rating", res.data)
        this.getMyBooking(this.crrUser.email);
      }
    )
  }
  toggleDetailRoom(id_bk:number, id_room:number){
    if (this.selectDetailRoom?.id_bk === id_bk && this.selectDetailRoom?.id_room === id_room) {
      this.selectDetailRoom = null; // bấm lại thì ẩn đi
    } else {
      this.selectDetailRoom = { id_bk, id_room }; // lưu cả index cha & con
    }
  }

  // Check if booking can retry payment (Pending/Fail status and within 3 hours)
  canRetryPayment(booking: any): boolean {
    if (!['Pending', 'Fail'].includes(booking?.status)) {
      return false;
    }
    // Check if updated within 3 hours (180 minutes)
    if (booking?.updatedAt) {
      const updatedTime = booking.updatedAt *1000;
      const now = Date.now();
      const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
      console.log("check time re turn: ",(now - updatedTime) < threeHours)
      return (now - updatedTime) < threeHours;
    }
    return false;
  }

  // Check if booking can be refunded
  canRefund(booking: any): boolean {
    return booking?.status === 'Confirm';
  }

  // Load refund info for a booking
  loadRefundInfo(booking: any): void {
    if (this.refundInfo[booking.uuid]) {
      return; // Already loaded
    }
    this.bookingService.getRefundInfo(booking.uuid).subscribe({
      next: (res) => {
        this.refundInfo[booking.uuid] = res;
      },
      error: (err) => {
        console.error('Error loading refund info:', err);
      }
    });
  }

  // Process refund
  processRefund(booking: any): void {
    if (!confirm('Bạn có chắc chắn muốn hủy booking và hoàn tiền?')) {
      return;
    }
    
    this.refundLoading[booking.uuid] = true;
    this.bookingService.processRefund(booking.uuid).subscribe({
      next: (res) => {
        alert(`Hoàn tiền thành công! Số tiền: ${this.formatCurrency(res.refund_amount)}`);
        this.getMyBooking(this.crrUser.email);
        this.refundLoading[booking.uuid] = false;
      },
      error: (err) => {
        alert(`Lỗi: ${err?.error?.message || 'Không thể hoàn tiền'}`);
        this.refundLoading[booking.uuid] = false;
      }
    });
  }

  // Retry payment
  // retryPayment(booking: any): void {
  //   if(booking.currency === 'VND'){
  //     this.handleVNPay()
  //   }else{
      
  //   }
  // }

  formatCurrency(value: number | string): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  ngAfterViewInit() {
    this.myBooking
    .filter(b => b.status === 'Pending' && b.currency === 'USD')
    .forEach(booking => this.renderPaypalButton(booking));
  }

  renderPaypalButton(booking: any) {
    const containerId = `paypal-button-container-${booking.uuid}`;
    paypal.Buttons({
      createOrder: async (data: any, actions: any) => {
        const body = {
          method: "paypal",
          action: 'Repayment',
          booking_id: booking.uuid, 
          currency: 'USD',
          session_id: booking.session_id
        };
  
        const res = await fetch("https://.../create-payment/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
  
        const dataRes = await res.json();
        booking.paypalBookingId = dataRes.data.bookingId; // lưu tạm trong booking object
  
        return dataRes.data.paypalOrder.id;
      },
  
      onApprove: async (data: any, actions: any) => {
        const captureRes = await fetch("https://.../paypal-capture/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.orderID,
            booking_id: booking.paypalBookingId
          }),
        });
        const result = await captureRes.json();
        this.router.navigate(['booking/success'], { queryParams: { transaction_id: result.transactionId } });
      },
  
      onCancel: (data: any) => alert("Bạn đã hủy thanh toán."),
      onError: (err: any) => console.error("PayPal error:", err)
    }).render(`#${containerId}`);
  }

  handleVNPay(booking:any){
    const payload = {
      method: "vnpay",
      currency: 'VND',
      action:"Repayment",
      booking_id : booking.uuid,
      session_id: booking.session_id
    };
    this.paymentService.createBooking(payload).pipe(
      map(res=>res.data.redirectUrl)
    ).subscribe(url=>{
      window.location.href = url;
      // localStorage.removeItem('session_id')
      console.log(url)
    }

    )

  }
}
