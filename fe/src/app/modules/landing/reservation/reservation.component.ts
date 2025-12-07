import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { environment } from 'environments/environment.fullstack';
import { ActivatedRoute } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, TranslocoModule, SharedModule, LanguagesComponent],
  templateUrl: './reservation.component.html',
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
export class ReservationComponent implements OnInit {
  baseUrl = environment.baseUrl;
  reservationForm:FormGroup;
  isSubmitted:boolean;
  bookings:any[] = [];
  payload:any[] = [];
    selectDetailRoom: { id_bk: number; id_room: number } | null = null;

  constructor(private fb: FormBuilder, private bookingService:BookingService,private activeRoute:ActivatedRoute) {
    
  }

  ngOnInit(): void {
      this.reservationForm = this.fb.group({
        email :['',[Validators.email, Validators.required]],
        transactionId : ['',Validators.required]
      })
      this.activeRoute.queryParams.subscribe(params=>{
        console.log("check parmas:" , params)
        this.reservationForm.get('transactionId').setValue(params['transactionId'])
      })
  }
  toggleDetailRoom(id_bk:number, id_room:number){
    if (this.selectDetailRoom?.id_bk === id_bk && this.selectDetailRoom?.id_room === id_room) {
      this.selectDetailRoom = null; // bấm lại thì ẩn đi
    } else {
      this.selectDetailRoom = { id_bk, id_room }; // lưu cả index cha & con
    }
  }

  submit(){
    this.isSubmitted = true;
    if(this.reservationForm.invalid){
      this.reservationForm.markAllAsTouched();
      return;
    }
    const searchFilter = {
      field:['payments__transaction_id', 'booking__uuid'],
      option:'contains',
      value:this.reservationForm.get('transactionId').value
    }
    this.payload=[
    {
      field:'user_email',
      option:'contains',
      value:this.reservationForm.get('email').value
    }]
    console.log('check data:', this.reservationForm.get('email').value, this.reservationForm.get('transactionId').value)
    this.bookingService.getMyBooking({filterRules:this.payload, search_rule:searchFilter}).subscribe({
      next: (res)=>{
        this.bookings = res.data;
        console.log("check dât: ", this.bookings)
        
      },
      error:(err)=>{}
    })
  }
  getClassStatus(status:string){
    if(status === 'Cancelled'){
      return 'bg-red-400 text-red-900'
    }
    if(status === 'Pending'){
      return 'bg-amber-400 text-amber-900'
    }
    if(status === 'Check In'){
      return 'bg-emerald-400 text-emerald-900'
    }
    if(status === 'Check Out'){
      return 'bg-slate-400 text-slate-900'
    }
    if(status === 'Cancelled'){
      return 'bg-rose-400 text-rose-900'
    }
    return 'bg-gray-400 text-grat-900'
  }
}
