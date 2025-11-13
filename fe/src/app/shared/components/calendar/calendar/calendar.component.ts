import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, Renderer2, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { CalendarPrice } from 'app/core/admin/hotel/hotel.types';
import { getCurrentDateString } from 'app/shared/utils/util';
import { formatPrice } from 'app/shared/utils/marketplace/format_price.util';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  formatted: string;
  isToday?:boolean;
  price?:string
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './calendar.component.html',
  styleUrls:['./calendar.component.scss']
})
export class CalendarComponent implements  AfterViewInit, OnInit, OnChanges {
  @ViewChild('currentDate', { static: true }) currentDate!: ElementRef;
  @ViewChild('days', { static: true }) daysListElement!: ElementRef;
  @ViewChild('icon_span', { static: true }) prevNextIcon!:ElementRef;
  private hotelService = inject(HotelService);
  // getting new date, current year and month
  @Input() date:Date = null;
  @Input() chooseDay:Date = null;
  calendarDays: CalendarDay[] = [];
  today: Date | null = new Date();
  currYear
  currMonth;
  selectedDate:Date;
  // storing full name of all months in array
  months = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];

  @Input() crrHotel:string = '';
  @Input() isDisplayCalendar:boolean = false;
  @Output() selectedDayEmit: EventEmitter<Date> = new EventEmitter<Date>();
  @Output() nextMonth:EventEmitter<string> = new EventEmitter<string>();
  @Output() prevMonth:EventEmitter<string> = new EventEmitter<string>();
  priceList: CalendarPrice[] = [];
  constructor(private el: ElementRef, private renderer: Renderer2){}
  

  renderCalendar() {
    if (!this.daysListElement || !this.currentDate) {
      console.warn('Calendar elements not ready yet');
      return;
    }
    const days: CalendarDay[] = [];
    let firstDayofMonth = new Date(this.currYear, this.currMonth, 1).getDay();
    let lastDateofMonth = new Date(this.currYear, this.currMonth + 1, 0).getDate();
    let lastDayofMonth = new Date(this.currYear, this.currMonth, lastDateofMonth).getDay();
    let lastDateofLastMonth = new Date(this.currYear, this.currMonth, 0).getDate();
    console.log("first day: ", firstDayofMonth)
    console.log("lastDateofMonth: ", lastDateofMonth)
    console.log("lastDayofMonth: ", lastDayofMonth)
    console.log("lastDateofLastMonth: ", lastDateofLastMonth)
    let liTag = "";

    // Previous month
    for (let i = firstDayofMonth; i > 0; i--) {
      days.push({
        date: new Date(this.currYear, this.currMonth - 1, lastDateofLastMonth - i + 1),
        isCurrentMonth: false,
        formatted: (lastDateofLastMonth - i + 1).toString()
      });
    }
    console.log("data def and select: ", this.date, this.selectedDate)
    // Current month
    for (let i = 1; i <= lastDateofMonth; i++) {
      const dateObj = new Date(this.currYear, this.currMonth, i);
      const isToday = this.selectedDate
                    ? (i === this.selectedDate.getDate() &&
                      this.currMonth === this.selectedDate.getMonth() &&
                      this.currYear === this.selectedDate.getFullYear())
                    : (this.date &&
                      i === this.date.getDate() &&
                      this.currMonth === this.date.getMonth() &&
                      this.currYear === this.date.getFullYear());
       // Tìm giá từ list theo ngày
      const priceData = this.priceList.find(item => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getFullYear() === dateObj.getFullYear() &&
          itemDate.getMonth() === dateObj.getMonth() &&
          itemDate.getDate() === dateObj.getDate()
        );
      });
      days.push({
        date: new Date(this.currYear, this.currMonth, i),
        isCurrentMonth: new Date(this.currYear, this.currMonth, i) >= this.date || isToday ? true : false,
        formatted: i.toString(),
        isToday,
        price: priceData && (new Date(this.currYear, this.currMonth, i) >= this.date || isToday)? formatPrice(priceData.price) : null
      });
    }

    // Next month
    for (let i = lastDayofMonth; i < 6; i++) {
      days.push({
        date: new Date(this.currYear, this.currMonth + 1, i - lastDayofMonth + 1),
        isCurrentMonth: false,
        formatted: (i - lastDayofMonth + 1).toString()
      });
    }

    this.calendarDays = days;
    console.log("days: ", this.calendarDays)

    this.currentDate.nativeElement.innerHTML = `${this.months[this.currMonth]} ${this.currYear}`;
  }
  // ngOnInit(): void {
  //   this.renderCalendar();
  // }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['date'] && !changes['date'].currentValue) {
      this.currYear = changes['date'].currentValue.getFullYear();
      this.currMonth = changes['date'].currentValue.getMonth();
      console.log("change")
      this.hotelService.getCalenderPrice({"hotel_id":this.crrHotel, "crr_date":getCurrentDateString(changes['date'].currentValue)}).subscribe(res =>{
        this.priceList = res.data;
        console.log("this.priceList:" , this.priceList)
        this.renderCalendar();
      })
    }
  }
  ngOnInit(): void {
    console.log("init")
    if(!this.date){
      this.date = new Date();
      this.currMonth  = this.date.getMonth();
      this.currYear  = this.date.getFullYear();
      this.hotelService.getCalenderPrice({"hotel_id":this.crrHotel, "crr_date":getCurrentDateString(this.date)}).subscribe(res =>{
        this.priceList = res.data;
        console.log("this.priceList:" , this.priceList)
        this.renderCalendar();
      })
    }
  }
  ngAfterViewInit(): void {
    this.setupNavigationListeners();
    
  }
  setupNavigationListeners() {
    this.renderer.listen(this.prevNextIcon.nativeElement, 'click', (event: any) => {
      const target = event.target as HTMLElement;
      if (target.id === 'prev') this.handlePrev();
      else if (target.id === 'next') this.handleNext();
    });
  }

  handlePrev() {
    this.prevMonth.emit('');
    this.currMonth--;
    if (this.currMonth < 0) {
      this.currMonth = 11;
      this.currYear--;
    }
    console.log("prev")
    this.hotelService.getCalenderPrice({"hotel_id":this.crrHotel, "crr_date":getCurrentDateString(new Date(this.currYear, this.currMonth, 1))}).subscribe(res =>{
      this.priceList = res.data;
      console.log("this.priceList:" , this.priceList)
      this.renderCalendar();
    })
  }

  handleNext() {
    this.nextMonth.emit();
    this.currMonth++;
    if (this.currMonth > 11) {
      this.currMonth = 0;
      this.currYear++;
    }console.log("next")
    this.hotelService.getCalenderPrice({"hotel_id":this.crrHotel, "crr_date":getCurrentDateString(new Date(this.currYear, this.currMonth, 1))}).subscribe(res =>{
      this.priceList = res.data;
      console.log("this.priceList:" , this.priceList)
      this.renderCalendar();
    })
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth) return; // Không chọn ngày ngoài tháng

    const newDate = day.date;

    // Nếu đã chọn ngày này rồi → bỏ chọn
    if (this.selectedDate && this.isSameDay(this.selectedDate, newDate)) {
      this.selectedDate = null;
    } else {
      this.selectedDate = newDate;
    }
    console.log(this.selectedDate)
    this.selectedDayEmit.emit(this.selectedDate)
    // Cập nhật lại isToday cho tất cả các ngày
    this.updateSelectedHighlight(this.selectedDate);
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private updateSelectedHighlight(date?:Date) {
    this.calendarDays = this.calendarDays.map(day => ({
      ...day,
      isToday: this.selectedDate ? this.isSameDay(day.date, this.selectedDate) : false
    }));
  }
  
}
