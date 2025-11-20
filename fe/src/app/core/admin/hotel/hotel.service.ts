import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    Subject,
    BehaviorSubject,
    switchMap,
    tap,
} from 'rxjs';
import { Hotel, CalendarPrice } from './hotel.types';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private hotelSubject: BehaviorSubject<Hotel[]> = new BehaviorSubject<Hotel[]>([]);
  hotel$: Observable<Hotel[]> = this.hotelSubject.asObservable();
  private listImageExploreHotel = ['assets/images/explore-hotel/images_1.jpg', 'assets/images/explore-hotel/images_2.jpg', 'assets/images/explore-hotel/images_3.jpg']; // hoặc danh sách ảnh
  private intervalMinutes = 30;
  constructor(private http: HttpClient) { }

  getCurrentImageExplore(): string {
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const index = Math.floor(minutesSinceMidnight / this.intervalMinutes) % this.listImageExploreHotel.length;
    return this.listImageExploreHotel[index];
  }

  getHotelData(){
    return this.hotelSubject.getValue();
  }

  getAllHotels(params?: any): Observable<{data: Hotel[], total: number, page: number, page_size: number}> {
    return this.http.post<any>(uriConfig.API_HOTEL_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(response => {
        this.hotelSubject.next(response.data);
      })
    );
  }

  getHotels(params?: any): Observable<{data: Hotel[], total: number, page: number, page_size: number}> {
    return this.http.post<any>(uriConfig.API_HOTEL_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
    );
  }
  
  createHotel(hotel: Partial<Hotel>): Observable<any> { 
    return this.http.post(uriConfig.API_HOTEL_CREATE, hotel);
  }
  
  updateHotel(uuid: string, hotel: Partial<Hotel>): Observable<any> {
    return this.http.patch(uriConfig.API_HOTEL_UPDATE(uuid), hotel);
  }
  deleteHotel(uuid: string): Observable<any> {
    return this.http.delete(uriConfig.API_HOTEL_DELETE(uuid));
  }

  getDetailHotel(slug:string): Observable<any>{
    return this.http.get(uriConfig.API_HOTEL_DETAIL(slug))
  }

  getCalenderPrice(payload:any):Observable<{data:CalendarPrice[]}>{
    return this.http.post<{ data: CalendarPrice[] }>(uriConfig.API_HOTEL_CALENDAR_PRICE, payload).pipe(
      map(res =>({
        data : res.data
      }))
    );
  }

  getExploreHotels(payload:any, urlEndpoint?:string):Observable<any>{
    
    return this.http.post<{data: any, searchData?:any}>(uriConfig.API_EXPLORE_HOTELS, payload).pipe(
      map(res =>({
        data: res.data
      }))
    )
  }

  getHotelById(uuid:string):Observable<any>{
    return this.http.get<any>(uriConfig.API_HOTEL_DETAIL(uuid)).pipe(
      map(res =>({
        data : res.data
      }))
    )
  }
}
