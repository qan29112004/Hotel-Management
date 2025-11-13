import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../uri/config';
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
@Injectable({
  providedIn: 'root'
})
export class BookingService {
  

  constructor( private http:HttpClient) { }

  getAllRoomTypeSelectRoom(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_LIST_ROOM_TYPE_RATE, payload).pipe(
      map(res=>({
        data: res.data
      }))
    )
  }

  createBooking(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_CREATE_PAYMENT, payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }

  createSessionBooking(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_CREATE_SESSTION, payload).pipe(
      map(res=>({
        data:res.sessionId
      }))
    )
  }
  createHoldRoom(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_CREATE_HOLE, payload).pipe(
      
    )
  }
  listHoldRoom(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_LIST_HOLD_ROOM, payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }

  checkSession(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_CHECK_SESSION, payload).pipe(
      map(res=>({
        data:res.data.check
      }))
    )
  }

  getListHoldRoom(payload:any):Observable<any>{
    return this.http.post<any>(uriConfig.API_LIST_HOLD_ROOM,payload).pipe(
      
    )
  }

}
