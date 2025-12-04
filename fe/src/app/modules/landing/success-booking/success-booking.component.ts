import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { formatISODate } from 'app/shared/utils/util';

@Component({
  selector: 'app-success-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-booking.component.html',
  styles: ``
})
export class SuccessBookingComponent implements OnInit {
  status: 'success' | 'failed' | null = null;
  transactionId: string = '';
  bookingId: string = '';
  errorMessage: string = '';
  errorCode: string = '';
  amount: string = '';
  hotelName: string = '';
  roomType: string = '';
  bookingDetails: any = null;
  loading: boolean = false;
  formatISODate = formatISODate;
  VNPAY_ERROR_CODES = {
    "00": "Giao dịch thành công",
    "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
    "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
    "10": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
    "11": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
    "12": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
    "13": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
    "24": "Giao dịch không thành công do: Khách hàng hủy giao dịch",
    "51": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
    "65": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
    "75": "Ngân hàng thanh toán đang bảo trì.",
    "79": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
    "99": "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    // # Query/Refund errors
    "02": "Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)",
    "03": "Dữ liệu gửi sang không đúng định dạng",
    "04": "Không cho phép hoàn trả toàn phần sau khi hoàn trả một phần",
    "91": "Không tìm thấy giao dịch yêu cầu",
    "93": "Số tiền hoàn trả không hợp lệ. Số tiền hoàn trả phải nhỏ hơn hoặc bằng số tiền thanh toán.",
    "94": "Yêu cầu bị trùng lặp trong thời gian giới hạn của API (Giới hạn trong 5 phút)",
    "95": "Giao dịch này không thành công bên VNPAY. VNPAY từ chối xử lý yêu cầu.",
    "97": "Chữ ký không hợp lệ",
    "98": "Timeout Exception",
}

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.status = 'success'
    this.route.queryParams.subscribe(params => {
      this.status = params['vnp_ResponseCode'] === '00' || params['response_code'] === '00'?'success':'failed';
      this.transactionId = params['vnp_TransactionNo']? params['vnp_TransactionNo']: params['transaction_id'] || '';
      this.bookingId = params['vnp_TxnRef'] ? params['vnp_TxnRef']: params['booking_id'] || '';
      this.amount = params['vnp_Amount']?params['vnp_Amount']:params['amount'] || 0;
      this.errorMessage = this.VNPAY_ERROR_CODES[params['vnp_ResponseCode']] || '';
      this.errorCode = params['error_code'] || '';
      if(localStorage.getItem('session_id')){localStorage.removeItem("session_id")}
      if(localStorage.getItem('booking_id')){localStorage.removeItem("booking_id")}
      
      // Fetch booking details if we have bookingId
      if (this.bookingId) {
        this.fetchBookingDetails();
      }
    });
  }

  fetchBookingDetails(): void {
    this.loading = true;
    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        if (booking) {
          this.bookingDetails = booking;
          this.hotelName = booking.hotel?.name || '';
          this.amount = booking.total_price || booking.price_in_vnd || this.amount;
          
          // Format amount if it's a number
          if (this.amount && typeof this.amount === 'string') {
            const numAmount = parseFloat(this.amount);
            if (!isNaN(numAmount)) {
              // If amount is from VNPAY, it's already in VND (smallest unit), divide by 100
              if (numAmount > 1000000) {
                this.amount = (numAmount / 100).toString();
              }
            }
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching booking details:', err);
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number | string): string {
    if (!value) return '0 đ';
    
    let numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0 đ';
    
    // If amount is from VNPAY and is very large (likely in smallest unit), divide by 100
    // VNPAY returns amount in đồng * 100 (e.g., 30100000 means 301,000 VND)
    if (numValue > 1000000 && numValue % 100 === 0) {
      // Check if it looks like VNPAY format (ends with 00 and is large)
      numValue = numValue / 100;
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(numValue || 0);
  }

  getRoomTypeNames(): string {
    if (!this.bookingDetails?.bookingRoom || this.bookingDetails.bookingRoom.length === 0) {
      return '';
    }
    const roomTypes = this.bookingDetails.bookingRoom.map((room: any) => room.room_type_name);
    return [...new Set(roomTypes)].join(', ');
  }

  formatDateDisplay(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateString;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  viewBooking(): void {
    this.router.navigate(['/my-booking']);
  }

  retryPayment(): void {
    if (this.bookingId) {
      // Redirect to booking page with booking_id
      this.router.navigate(['/booking'], { 
        queryParams: { booking_id: this.bookingId, retry: true } 
      });
    }
  }
}
