import { Injectable } from '@angular/core';
import { uriConfig } from 'app/core/uri/config';
import { HttpClient } from '@angular/common/http';
import { pipe, map, tap, Subject, Observable, of, catchError,BehaviorSubject } from 'rxjs';
import { Booking } from './booking.type';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private offer: BehaviorSubject<Booking[]> = new BehaviorSubject<Booking[]>([]);
  offer$ = this.offer.asObservable()

  check(){
    return this.offer.getValue();
  }

  constructor(private http:HttpClient) { }
  getBooking(params?: any): Observable<{data: Booking[], total: number, page: number, page_size: number}> {
      return this.http.post<any>(uriConfig.API_BOOKING_ALL, params || {}).pipe(
        map(res => ({
          data: res.data?.data || [],
          total: res.data?.total,
          page: res.data?.page,
          page_size: res.data?.page_size
        })),
        tap(res=>{
          this.offer.next(res.data?.data);
        }),
        catchError(error => {
          console.error('Error fetching amenities:', error);
          return of({ data: [], total: 0, page: 1, page_size: 10 });
        })
      );
    }
  
    createBooking(offer: Partial<Booking>): Observable<any> {
      return this.http.post(uriConfig.API_BOOKING_CREATE, offer).pipe(
        
      );
    }
  
    updateBooking(uuid: string, offer: Partial<Booking>): Observable<any> {
      return this.http.patch(uriConfig.API_BOOKING_UPDATE(uuid), offer);
    }
  
    deleteBooking(uuid: string): Observable<any> {
      return this.http.delete(uriConfig.API_BOOKING_DELETE(uuid));
    }
}
