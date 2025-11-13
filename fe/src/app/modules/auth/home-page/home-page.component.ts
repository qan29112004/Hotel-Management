import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Router, RouterModule } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { LineAnimationComponent } from './line-animation/line-animation.component';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE  } from '@angular/material/core';
import { SharedModule } from 'app/shared/shared.module';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { Observable, map, switchMap, pipe } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { getCurrentDateString } from 'app/shared/utils/util';

// Định nghĩa format custom
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'd MMMM yyyy', // 👈 format hiển thị
    monthYearLabel: 'MMMM yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

@Component({
    selector: 'home-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        RouterModule,
        MatIconModule,
        LineAnimationComponent,
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule,
        MatNativeDateModule,
        SharedModule
    ],
    templateUrl: './home-page.component.html',
    animations: [
        trigger('fadeIn', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', animate('600ms ease-out')),
        ])
    ],
    styles: ``,
    providers: [{ provide: 'translocoScope', useValue: 'home-page' },
                { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
                { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ]
})
export class HomePageComponent implements OnInit {
    Math = Math;
    amount = 50000000;
    days = 0;
    interestRate = 0.14;
    isMenuOpen = false;
    selectedDes:string = '';
    code:string = '';
    showCalendar = false; // Biến điều khiển hiển thị lịch
    selectedDateCheckin: Date | null = null; // Lưu ngày được chọn
    selectedDateCheckout: Date | null = null;
    today:Date = new Date();
    displayDate: string | null = null;
    showGuestSelector = false;
    adults:number = 1;
    children:number = 0;
    optionsDestinations: { id: string; name: string }[] = [];
    hasOptionDestinationLoaded:boolean = false;
    roomList = [
        {adults:1, children:0}
    ];
    @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
    @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;

    constructor(
        public translocoService: TranslocoService,
        private datePipe: DatePipe,
        private destinationService: DestinationService,
        private router: Router
    ) { }

    ngOnInit(): void {
        if(this.destinationService.check()?.data?.length > 0){
      this.destinationService.destinations$.pipe(
        map(destinations => {
              return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
          })
      ).subscribe(res =>{
        this.optionsDestinations = res;
      })
    }else{
      this.destinationService.getDestinations().pipe(
          map(destinations => {
              return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
          }
      )
      ).subscribe((res) => {
          this.optionsDestinations = res;
          console.log('Destinations options: ', res);
      });}
    }

    activeIndex: number | null = 0; // Mở câu đầu tiên
    faqList = [
        { question: 'Q_1', answer: 'A_1' },
        { question: 'Q_2', answer: 'A_2' },
        { question: 'Q_3', answer: 'A_3' },
        { question: 'Q_4', answer: 'A_4' },
        { question: 'Q_5', answer: 'A_5' },
        { question: 'Q_6', answer: 'A_6' },
    ];
    submitSearch() {
        const queryParams: { [key: string]: any } = {};

        if (this.selectedDes) queryParams.dest = this.selectedDes;
        if (this.selectedDateCheckin) queryParams.checkin = getCurrentDateString(this.selectedDateCheckin);
        if (this.selectedDateCheckout) queryParams.checkout = getCurrentDateString(this.selectedDateCheckout);
        if (this.code?.trim()) queryParams.code = this.code.trim();
        console.log("checkin va checkout: ", queryParams.checkin, queryParams.checkout)
        this.roomList.forEach((room, i) => {
            queryParams[`rooms[${i}][adults]`] = room.adults;
            queryParams[`rooms[${i}][children]`] = room.children;
        });

        this.router.navigate(['/explore-hotels'], { queryParams });
    }
    testClick() {
        console.log('Mat-select clicked!');
    }
    

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

    // Xử lý khi chọn ngày
    onDateChange(event: any) {
        this.selectedDateCheckin = event.value;
    }

    toggleGuestSelector() {
        this.showGuestSelector = !this.showGuestSelector;
    }

    closeGuestSelector() {
        this.showGuestSelector = false;
    }

    get guestSummary() {
        const totalAdults = this.roomList.reduce((sum, r) => sum + r.adults, 0);
        const totalChildren = this.roomList.reduce((sum, r) => sum + r.children, 0);
        const totalGuests = totalAdults + totalChildren;
        return `${this.roomList.length} room${this.roomList.length > 1 ? 's' : ''}${totalGuests >= 1 ? ', ' + totalGuests + ' guests' : ''}`;
    }

    removeRoom() {
        if (this.roomList.length > 1) {
            this.roomList.pop();
        }
    }
    addRoom() {
        if (this.roomList.length < 5) { 
            this.roomList.push({ adults: 1, children: 0 });
        }
    }

    get minCheckoutDate(): Date | null {
        if (!this.selectedDateCheckin) return null;
        const date = new Date(this.selectedDateCheckin);
        date.setDate(date.getDate() + 1);
        return date;
    }
}   