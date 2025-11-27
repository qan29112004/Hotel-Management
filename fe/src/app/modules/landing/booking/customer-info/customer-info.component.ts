import { Component, EventEmitter, Input, Output, OnInit, ViewChild, ElementRef, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { PhoneInputComponent } from 'app/shared/components/phone-input/phone-input.component';
import { SelectCountryComponent } from 'app/shared/components/select-country/select-country.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { count } from 'firebase/firestore';
import { BookingService } from 'app/core/booking/booking.service';
import { Subject, takeUntil,map } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { timeDate } from 'app/shared/utils/util';
import { UserService } from 'app/core/profile/user/user.service';
import { VoucherService } from 'app/core/admin/voucher/voucher.service';

declare var paypal: any;

interface VoucherClaim {
  uuid: string;
  voucher: {
    code: string;
    name: string;
    description?: string | null;
    discountType: string;
    discountValue: number;
    discountPercent?: number | null;
    maxDiscountAmount?: number | null;
    minOrderValue: number;
    expireAt?: string | null;
    status: string;
  };
  expiresAt?: string | null;
  status: string;
  usageCount: number;
}

interface VoucherPreviewResult {
  code: string;
  discountAmount: number;
  finalTotal: number;
  message?: string;
}
@Component({
  selector: 'app-customer-info',
  standalone: true,
  imports: [CommonModule, SharedModule,PhoneInputComponent, SelectCountryComponent],
  templateUrl: './customer-info.component.html',
  styles: ``
})
export class CustomerInfoComponent implements OnInit, OnDestroy {
  timeDate=timeDate;
  @Input() rooms!: any[];
  @Input() billVND:any;
  @Input()billUSD:any;
  @Output() submitBooking = new EventEmitter<any>();
  @Input() bookingState:any;
  @Input() dataBooking:any;
  @Input() dataRate:any[];
  info = { name: '', email: '' };
  isSubmitted:boolean = false;
  isChecked:boolean = false;
  showAgreeError:boolean = false;
  bookingForm:FormGroup;
  crrUser:any;
  @ViewChild('formBooking') formBooking!:ElementRef;
  bookingPayload = signal<{ fullname: string; email: string; amount: number } | null>(null);
  bookingId:string;
  @ViewChild('paypalContainer', { static: false }) paypalContainer!: ElementRef<HTMLDivElement>;
  private destroy = new Subject();
  voucherLoading = false;
  previewLoadingCode: string | null = null;
  applyLoadingCode: string | null = null;
  activeVouchers: VoucherClaim[] = [];
  voucherPreviewResult: VoucherPreviewResult | null = null;
  voucherPreviewError: any | null = null;
  applyVoucherMessage: any | null = null;

  constructor(private fb: FormBuilder, private bookingService: BookingService, private activeRoute:ActivatedRoute, private router:Router, private userService:UserService, private voucherService:VoucherService) {
  }

  ngOnInit(): void {
    this.userService.user$.pipe(takeUntil(this.destroy)).subscribe(user=>{
      this.crrUser = user;
      console.log("this crrUser: ", this.crrUser)
    })
    this.bookingForm = this.fb.group({
      fullname:[this.crrUser?.fullName ?this.crrUser?.fullName:null, Validators.required],
      email: [this.crrUser?.email ?this.crrUser?.email:null,[Validators.required, Validators.email]],
      phone: [null,Validators.required],
      country : [null,Validators.required]
    })
    this.loadActiveVouchers();
  }

  ngOnDestroy(): void {
    this.destroy.next('');
    this.destroy.complete();
  }
  // Tính tổng phòng
  getTotalRooms(): number {
    return this.bookingState.rooms.length;
  }

  // Tính tổng số người lớn
  getTotalAdults(): number {
    return this.bookingState.rooms.reduce((total, room) => total + room.adults, 0);
  }

  // Tính tổng số trẻ em
  getTotalChildren(): number {
    return this.bookingState.rooms.reduce((total, room) => total + room.children, 0);
  }

  // Tính tổng số khách (người lớn + trẻ em)
  getTotalGuests(): number {
    return this.getTotalAdults() + this.getTotalChildren();
  } 

  submitForm() {
    this.submitBooking.emit(this.info);
  }
  selectCountry(country:any){
    if(country){
      console.log("emit country: ", country)
      this.bookingForm?.get('country').setValue(country)
    }
  }
  selectedPhone(phone:string){
    if(phone){
      this.bookingForm.get('phone').setValue(phone);
    }
  }
  onChangeCheckBox(checked:any){
    this.isChecked = checked;
    if (checked) this.showAgreeError = false;
  }

  onSubmit(method:string){
    this.isSubmitted = true;
    if (this.bookingForm.invalid) {
      // Nếu form không hợp lệ, hiển thị lỗi
      this.bookingForm.markAllAsTouched();
      this.formBooking.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return;
    }

    if (!this.isChecked) {
      this.showAgreeError = true;
      return;
    }
    this.handleVNPay();
    
    // if (method === 'paypal') {
    //   console.log("chay paypal")
    //   this.handleCustomPayPal();
    // } else {
    //   // this.handleVNPay();
    // }
  }

  handleVNPay(){
    const payload = {
      method: "vnpay",
      user_email: this.bookingForm.get('email').value,
      user_fullname: this.bookingForm.get('fullname').value,
      user_country: this.bookingForm.get('country').value,
      user_phone: this.bookingForm.get('phone').value,
      hotel_name: this.dataBooking['hotel_name'],
      check_in: this.dataBooking['checkin'],
      check_out: this.dataBooking['checkout'],
      num_guest: this.getTotalGuests(),
      total_rooms: this.getTotalRooms(),
      total_price: this.billVND,
      currency: 'VND',
      session_id :localStorage.getItem('session_id'),
      booking_id : localStorage.getItem('booking_id')
    };
    this.bookingService.createBooking(payload).pipe(
      map(res=>res.data.redirectUrl),
      takeUntil(this.destroy)
    ).subscribe(url=>{
      window.location.href = url;
      // localStorage.removeItem('session_id')
      console.log(url)
    }

    )

  }

  loadActiveVouchers(){
    this.voucherLoading = true;
    this.voucherService.listMyVoucher().pipe(
      takeUntil(this.destroy)
    ).subscribe({
      next: (res)=>{
        const claims: VoucherClaim[] = res.data || [];
        const now = new Date();
        this.activeVouchers = claims.filter(claim=>{
          if (claim.status !== 'ACTIVE') return false;
          const claimExpired = claim.expiresAt ? new Date(claim.expiresAt) < now : false;
          const voucherExpired = claim.voucher.expireAt ? new Date(claim.voucher.expireAt) < now : false;
          return !claimExpired && !voucherExpired;
        }).sort((a,b)=>{
          const aDate = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const bDate = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          return aDate - bDate;
        });
        console.log("check res: ", res),
        console.log("check list: ", this.activeVouchers)
        this.voucherLoading = false;
      },
      error: ()=>{
        this.voucherLoading = false;
      }
    })
  }

  previewVoucher(claim:VoucherClaim){
    this.voucherPreviewError = null;
    this.voucherPreviewResult = null;
    this.previewLoadingCode = claim.voucher.code;
    const payload = {
      code: claim.voucher.code,
      order_total: Number(this.billVND) || 0,
      hotel_id: this.dataBooking?.hotel_id || null
    };
    this.voucherService.previewVoucher(payload).pipe(
      takeUntil(this.destroy)
    ).subscribe({
      next:(res)=>{
        this.voucherPreviewResult = {
          code: claim.voucher.code,
          discountAmount: Number(res.data?.discountAmount) || 0,
          finalTotal: Number(res.data?.finalTotal) || Number(this.billVND) || 0,
          message: res.data?.message
        };
        this.previewLoadingCode = null;
      },
      error:(err)=>{
        this.previewLoadingCode = null;
        this.voucherPreviewError = err?.error?.message || 'Không thể xem trước voucher, vui lòng thử lại.';
      }
    });
  }

  applyVoucher(claim:VoucherClaim){
    this.applyVoucherMessage = null;
    this.applyLoadingCode = claim.voucher.code;
    const payload = {
      code: claim.voucher.code,
      booking_uuid: localStorage.getItem('booking_id') || 'mock-booking-id',
      order_total: Number(this.billVND) || 0
    };
    this.voucherService.applyVoucher(payload).pipe(
      takeUntil(this.destroy)
    ).subscribe({
      next:(res)=>{
        this.applyVoucherMessage = res.data;
        this.applyLoadingCode = null;
      },
      error:(err)=>{
        this.applyLoadingCode = null;
        this.applyVoucherMessage = err?.errors;
      }
    })
  }

  getVoucherDiscountText(claim:VoucherClaim){
    if(claim.voucher.discountType === 'FIXED'){
      return `Giảm ${this.formatCurrency(claim.voucher.discountValue)}`;
    }
    const maxText = claim.voucher.maxDiscountAmount ? ` - tối đa ${this.formatCurrency(claim.voucher.maxDiscountAmount)}` : '';
    return `Giảm ${claim.voucher.discountPercent}%${maxText}`;
  }

  formatCurrency(value:number){
    return new Intl.NumberFormat('vi-VN', {style:'currency', currency:'VND', minimumFractionDigits:0}).format(Number(value) || 0);
  }

  formatVoucherDate(dateStr?:string | null){
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric'});
  }

  ngAfterViewInit() {
    paypal.Buttons({
      createOrder: async (data: any, actions: any) => {
        // 👉 Lúc này mới lấy giá trị mới nhất từ form
        const body = {
          method: "paypal",
          user_email: this.bookingForm.get('email').value,
          user_fullname: this.bookingForm.get('fullname').value,
          user_country: this.bookingForm.get('country').value,
          user_phone: this.bookingForm.get('phone').value,
          hotel_name: this.dataBooking['hotel_name'],
          check_in: this.dataBooking['checkin'],
          check_out: this.dataBooking['checkout'],
          num_guest: this.getTotalGuests(),
          total_rooms: this.getTotalRooms(),
          total_price: this.billUSD,
          booking_id : localStorage.getItem('booking_id'),
          currency: 'USD'
        };

        // Gọi backend để tạo order
        const res = await fetch("https://nonfreezing-malena-ungambling.ngrok-free.dev/api/payment/create-payment/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const dataRes = await res.json();
        this.bookingId = dataRes.data.bookingId;
        console.log("PayPal order created:", dataRes);

        // Trả về orderID để PayPal SDK dùng
        return dataRes.data.paypalOrder.id;
      },

      // Khi người dùng thanh toán thành công
      onApprove: async (data: any, actions: any) => {
        const captureRes = await fetch("https://nonfreezing-malena-ungambling.ngrok-free.dev/api/payment/paypal-capture/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.orderID,
            booking_id: this.bookingId,
            session_id: localStorage.getItem('session_id') // hoặc lấy từ response trước đó
          }),
        });
        const result = await captureRes.json();
        // alert(" Thanh toán thành công! Mã giao dịch: " + result.transactionId);
        // localStorage.removeItem('session_id')
        const queryParams: { [key: string]: any } = {};
        queryParams.transaction_id = result.transactionId;
        this.router.navigate(['booking/success'], {queryParams})
      },

      onCancel: (data: any) => {
        alert(" Bạn đã hủy thanh toán.");
      },

      onError: (err: any) => {
        console.error("PayPal error:", err);
      }
    }).render('#paypal-button-container'); // render vào div thật
  }
}
