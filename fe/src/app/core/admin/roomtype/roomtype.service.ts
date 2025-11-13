import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    switchMap,
    tap,
} from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class RoomtypeService {

  constructor(private httpClient: HttpClient) { }

  getRoomTypes(params?: any): Observable<{data: any[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_ROOM_TYPE_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      catchError(error => {
        console.error('Error fetching room types:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  createRoomType(roomType: Partial<any>): Observable<any> {
    return this.httpClient.post(uriConfig.API_ROOM_TYPE_CREATE, roomType);
  }

  updateRoomType(uuid: string, roomType: Partial<any>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_ROOM_TYPE_UPDATE(uuid), roomType);
  }

  deleteRoomType(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_ROOM_TYPE_DELETE(uuid));
  }

  getRoomTypeByUuid(uuid: string): Observable<any> {
    return this.httpClient.get<any>(uriConfig.API_ROOM_TYPE_UPDATE(uuid)).pipe(
      map(res => res.data),
      catchError(error => {
        console.error('Error fetching room type by UUID:', error);
        return of(null);
      })
    );
  }
}
