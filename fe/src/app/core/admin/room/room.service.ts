import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    BehaviorSubject,
    switchMap,
    tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private _room:BehaviorSubject<any[]> = new BehaviorSubject<any[]>(null);
  room$ = this._room.asObservable();
  constructor(private httpClient: HttpClient) { }

  set room(value:any){
    this._room.next(value);
  }

  check(){
    return this._room.getValue();
  }

  getRoom(param:any):Observable<{data: any[], total: number, page: number, page_size: number}>{
    return this.httpClient.post<any>(uriConfig.API_ROOM_ALL, param).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res =>{
        this.room = res.data;
      })
    )
  }
  createRoom(room:any): Observable<any>{
    return this.httpClient.post<any>(uriConfig.API_ROOM_CREATE, room);
  }

  updateRoom(uuid:string, room: Partial<any>): Observable<any>{
    return this.httpClient.patch(uriConfig.API_ROOM_UPDATE(uuid), room)
  }

  deleteRoom(uuid:string):Observable<any>{
    return this.httpClient.delete(uriConfig.API_ROOM_DELETE(uuid));
  }
}
