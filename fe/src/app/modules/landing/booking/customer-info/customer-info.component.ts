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

declare var paypal: any;
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

  constructor(private fb: FormBuilder, private bookingService: BookingService, private activeRoute:ActivatedRoute, private router:Router, private userService:UserService) {
  }

  ngOnInit(): void {
    this.userService.user$.subscribe(user=>{
      this.crrUser = user;
      console.log("this crrUser: ", this.crrUser)
    })
    this.bookingForm = this.fb.group({
      fullname:[this.crrUser?.fullName ?this.crrUser?.fullName:null, Validators.required],
      email: [this.crrUser?.email ?this.crrUser?.email:null,[Validators.required, Validators.email]],
      phone: [null,Validators.required],
      country : [null,Validators.required]
    })
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
      session_id :localStorage.getItem('session_id')
    };
    this.bookingService.createBooking(payload).pipe(
      map(res=>res.data.redirectUrl),
      takeUntil(this.destroy)
    ).subscribe(url=>{
      window.location.href = url;
      localStorage.removeItem('session_id')
      console.log(url)
    }

    )

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
        alert("✅ Thanh toán thành công! Mã giao dịch: " + result.transactionId);
        localStorage.removeItem('session_id')
      },

      onCancel: (data: any) => {
        alert("❌ Bạn đã hủy thanh toán.");
      },

      onError: (err: any) => {
        console.error("PayPal error:", err);
      }
    }).render('#paypal-button-container'); // render vào div thật
  }
}
