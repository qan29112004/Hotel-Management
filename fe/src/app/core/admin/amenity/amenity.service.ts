import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { Amenity } from './amenity.types';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    switchMap,
    tap,
    BehaviorSubject,
} from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AmenityService {
  private amenity: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  amenity$ = this.amenity.asObservable();

  constructor(private httpClient:HttpClient) { }

  check(){
    return this.amenity.getValue();
  }

  getAmenities(params?: any): Observable<{data: Amenity[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_AMENITY_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res=>{
        this.amenity.next(res.data?.data);
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  createAmenity(amenity: Partial<Amenity>): Observable<any> {
    return this.httpClient.post(uriConfig.API_AMENITY_CREATE, amenity).pipe(
      
    );
  }

  updateAmenity(uuid: string, amenity: Partial<Amenity>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_AMENITY_UPDATE(uuid), amenity);
  }

  deleteAmenity(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_AMENITY_DELETE(uuid));
  }
}
