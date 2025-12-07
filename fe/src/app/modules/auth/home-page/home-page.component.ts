import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { Router, RouterModule } from '@angular/router';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SharedModule } from 'app/shared/shared.module';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { Observable, map, switchMap, pipe } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { OfferService } from 'app/core/admin/offer/offer.service';
import { OfferPopupComponent } from './offer-popup/offer-popup.component';

import { environment } from 'environments/environment.fullstack';
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
        MatDatepickerModule,
        MatInputModule,
        MatFormFieldModule,
        MatNativeDateModule,
        SharedModule,
        OfferPopupComponent
    ],
    templateUrl: './home-page.component.html',
    animations: [
        trigger('fadeIn', [
            state('hidden', style({ opacity: 0, transform: 'translateY(20px)' })),
            state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
            transition('hidden => visible', animate('600ms ease-out')),
        ])
    ],
    styleUrls: ['./home-page.component.scss'],
    providers: [{ provide: 'translocoScope', useValue: 'home-page' },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ]
})
export class HomePageComponent implements OnInit {
    baseUrl:string = environment.baseUrl;
    Math = Math;
    amount = 50000000;
    days = 0;
    interestRate = 0.14;
    isMenuOpen = false;
    selectedDes: string = '';
    code: string = '';
    showCalendar = false; // Biến điều khiển hiển thị lịch
    selectedDateCheckin: Date | null = null; // Lưu ngày được chọn
    selectedDateCheckout: Date | null = null;
    today: Date = new Date();
    displayDate: string | null = null;
    showGuestSelector = false;
    adults: number = 1;
    children: number = 0;
    optionsDestinations: { id: string; name: string }[] = [];
    hasOptionDestinationLoaded: boolean = false;
    roomList = [
        { adults: 1, children: 0 }
    ];
    offers = [];
    listImageExploreHotel =
        ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg', 'assets/images/explore-hotel/images_4.jpg', 'assets/images/explore-hotel/images_5.jpg', 'assets/images/explore-hotel/images_6.jpg', 'assets/images/explore-hotel/images_7.jpg', 'assets/images/explore-hotel/images_8.jpg', 'assets/images/explore-hotel/images_9.jpg', 'assets/images/explore-hotel/images_10.jpg', 'assets/images/explore-hotel/images_11.jpg', 'assets/images/explore-hotel/images_12.jpg']
        ;
    listImageOffer = [
        'assets/images/offer/bonus_1.jpg',
        'assets/images/offer/bonus_2.jpg',
        'assets/images/offer/bonus_3.jpg',
        'assets/images/offer/bonus_4.jpg',
        'assets/images/offer/bonus_5.jpg',
        'assets/images/offer/bonus_6.jpg',
        'assets/images/offer/bonus_7.jpg',
        'assets/images/offer/bonus_8.jpg',
        'assets/images/offer/bonus_9.jpg',
        'assets/images/offer/bonus_10.jpg',
    ]

    @ViewChild('pickerCheckin') pickerCheckin!: MatDatepicker<Date>;
    @ViewChild('pickerCheckout') pickerCheckout!: MatDatepicker<Date>;

    constructor(
        public translocoService: TranslocoService,
        private datePipe: DatePipe,
        private destinationService: DestinationService,
        private router: Router,
        private offerService: OfferService
    ) { }

    ngOnInit(): void {
        this.loadAllOffer()
        if (this.destinationService.check()?.data?.length > 0) {
            this.destinationService.destinations$.pipe(
                map(destinations => {
                    return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
                })
            ).subscribe(res => {
                this.optionsDestinations = res;
            })
        } else {
            this.destinationService.getDestinations().pipe(
                map(destinations => {
                    return destinations.data.map(dest => ({ id: dest.uuid, name: dest.name }));
                }
                )
            ).subscribe((res) => {
                this.optionsDestinations = res;
                console.log('Destinations options: ', res);
            });
        }
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

    loadAllOffer() {
        console.log("check cache offer data: ", this.offerService.check())
        if (this.offerService.check()?.length > 0) {
            this.offerService.offer$.subscribe(offer => {
                this.offers = offer;
            })
        } else (
            this.offerService.getAllOffer({ page_size: 0 }).subscribe(res => {
                this.offers = res.data
            })
        )
    }

    // Offer Popup Logic
    selectedOffer: any = null;
    selectedOfferImage: string = '';

    openOfferPopup(offer: any, image: string) {
        this.selectedOffer = offer;
        this.selectedOfferImage = image;
    }

    closeOfferPopup() {
        this.selectedOffer = null;
        this.selectedOfferImage = '';
    }

    getGridClass(i: number) {
        // Pattern mosaic lặp lại sau mỗi 6 item (dynamic)
        const mod = i % 8;

        switch (mod) {
            case 0:
                return 'col-span-6 row-span-2'; // item to
            case 1:
                return 'col-span-3 row-span-1';
            case 2:
                return 'col-span-3 row-span-1';
            case 3:
                return 'col-span-6 row-span-1'; // item to
            case 4:
                return 'col-span-3 row-span-1';
            case 5:
                return 'col-span-3 row-span-1';
            case 6:
                return 'col-span-6 row-span-2';
            default:
                return 'col-span-6 row-span-1';
            // default:
            //   return 'col-span-6 row-span-1';
        }
    }
}