import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { TranslocoService } from '@ngneat/transloco';
@Component({
  selector: 'app-my-club',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-club.component.html',
  styles: ``
})
export class MyClubComponent implements OnInit {
  crrUser:any;
  translocoService = inject(TranslocoService);
  @ViewChild('overview') overview:ElementRef;
  @ViewChild('status') status:ElementRef;
  @ViewChild('bookingReward') bookingReward:ElementRef;
  constructor(private userService:UserService) {
    
  }
  ngOnInit(): void {
      this.userService.user$.subscribe(user=>{
        this.crrUser = user
      })
  }
  scrollTo(tag:string){
    const tagNavigate = {
      'overview':this.overview,
      'status':this.status,
      'bookingReward':this.bookingReward,
    }
    tagNavigate[`${tag}`].nativeElement.scrollIntoView({behavior:'smooth', block:'center'})
  }
}
