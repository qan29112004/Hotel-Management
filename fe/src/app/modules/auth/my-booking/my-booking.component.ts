import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingService } from 'app/core/admin/rating/rating.service';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { UserService } from 'app/core/profile/user/user.service';
import { environment } from 'environments/environment.fullstack';
import { SharedModule } from 'app/shared/shared.module';
import { animate, style, transition, trigger } from '@angular/animations';
import { RatingComponent } from 'app/shared/components/rating/rating.component';
import { formatISODate } from 'app/shared/utils/util';
import { FormBuilder, FormGroup, Validator, Validators } from '@angular/forms';
@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, SharedModule, RatingComponent],
  templateUrl: './my-booking.component.html',
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
export class MyBookingComponent implements OnInit {
  formatISODate=formatISODate;
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
    this.ratingForm.get('rating').setValue(this.rating)
  }
  payload:any={
    review:"rating 1",
    rating:5,
    hotel:"fqrmuqqnqu",
    booking:"fwgypxnxhl",
    subject:"subject"
  }

  selectDetailRoom: { id_bk: number; id_room: number } | null = null;
  crrUser:any;
  filter:any[]=[];
  baseUrl:string = environment.baseUrl; 
  myBooking:any[];
  ratingForm:FormGroup;
  constructor(private fb: FormBuilder,private ratingService:RatingService, private bookingService:BookingService, private userService:UserService) {
    
  }

  ngOnInit(): void {
    this.userService.user$.subscribe(user=>{
      this.crrUser=user;
      this.getMyBooking(user.email)
    })
    this.ratingForm = this.fb.group({
        subject:['', Validators.required],
        review:['', Validators.required],
        rating:[0, Validators.required]
      })
  }

  getMyBooking(email:string){
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
}
