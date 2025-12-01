import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    this.route.queryParams.subscribe(params => {
      this.status = params['status'] || null;
      this.transactionId = params['transaction_id'] || '';
      this.bookingId = params['booking_id'] || '';
      this.errorMessage = params['error'] || '';
      this.errorCode = params['error_code'] || '';
      if(localStorage.getItem('session_id')){localStorage.removeItem("session_id")}
      if(localStorage.getItem('booking_id')){localStorage.removeItem("booking_id")}
      // Có thể fetch thêm thông tin booking nếu cần
      if (this.bookingId) {
        // TODO: Fetch booking details if needed
      }
    });
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
