import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {  Route, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { SharedModule } from 'app/shared/shared.module';
import {  Subscription } from 'rxjs';
import { NgOtpInputModule } from 'ng-otp-input';
import { TranslocoService } from '@ngneat/transloco';


@Component({
  selector: 'app-otp-verification',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
  imports: [
    RouterLink,
    FuseAlertComponent,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    NgOtpInputModule
],
  templateUrl: './otp-verification.component.html',
  styles: ``
})
export class OtpVerificationComponent implements OnInit {
  @ViewChild('signInNgForm') signInNgForm: NgForm;

  alert: { type: FuseAlertType; message: string } = {
    type: 'success',
    message: '',
  };
  otpForm: UntypedFormGroup;
  showAlert: boolean = false;
  email = 'operdo2025@gmail.com';

  countdown = 60; // Thời gian đếm ngược
  isButtonDisabled = false; // Biến trạng thái nút
  private timerSubscription!: Subscription;
  interval: any;

  /**
   * Constructor
   */
  constructor(
    private _authService: AuthService,
    private _formBuilder: UntypedFormBuilder,
    private _translocoService: TranslocoService,
      // private _router: Route,
  ) { }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the form
    this.otpForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required]]
    });

    // Lấy thời gian hết hạn từ localStorage
    const expireAt = localStorage.getItem('otpCountdownExpireAt');
    if (expireAt) {
      const expireTime = parseInt(expireAt, 10);
      if (Date.now() < expireTime) {
        this.runCountdown(expireTime);
      } else {
        localStorage.removeItem('otpCountdownExpireAt');
      }
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  // Gửi OTP
  onOtpChange(code: string) {
    console.log('Đã thay đổi OTP:', code); // Xem có in ra từng số chưa
    if (code.length === 6) {
      console.log('OTP ĐẦY ĐỦ:', code);
      this.verifyOtp(code); // Gọi hàm xác thực OTP
    }
  }
  

  verifyOtp(code: string): void {
    const validOtp = '123456'; // Mã OTP hợp lệ
  
    if (code === validOtp) {
      this.alert = {
        type: 'success',
        message: this._translocoService.translate('Success'),
      };
      this.showAlert = true;
    } else {
      // Nếu sai -> hiển thị lỗi
      this.alert = {
        type: 'error',
        message: this._translocoService.translate('otp_verification.wrong'),
      };
      this.showAlert = true;
    }
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe(); // Hủy bỏ timer khi component bị hủy
    }
  }

  sendOtp(): void {
    // Gửi OTP
    console.log('Gửi OTP mới');

    // Kích hoạt đếm ngược
    this.startCountdown();
  }

  runCountdown(expireAt: number) {
    this.isButtonDisabled = true;

    this.interval = setInterval(() => {
      const now = Date.now();
      this.countdown = Math.floor((expireAt - now) / 1000);

      if (this.countdown <= 0) {
        clearInterval(this.interval);
        this.isButtonDisabled = false;
        this.countdown = 0;
        localStorage.removeItem('otpCountdownExpireAt');
      }
    }, 1000);
  }

  startCountdown() {
    const duration = 60; // giây
    const expireAt = Date.now() + duration * 1000;
    localStorage.setItem('otpCountdownExpireAt', expireAt.toString());
    this.runCountdown(expireAt);
  }
}