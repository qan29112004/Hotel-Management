import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { Facilities } from './facilities.types';
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
export class FacilitiesService {
  private facilities: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  facilities$ = this.facilities.asObservable();

  constructor(private httpClient:HttpClient) { }

  check(){
    return this.facilities.getValue();
  }

  getAllFacilities(params?: any): Observable<{data: Facilities[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_FACILITIES_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res=>{
        this.facilities.next(res.data?.data);
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  getFacilities(params?: any): Observable<{data: Facilities[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_FACILITIES_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  createFacilities(facilities: Partial<Facilities>): Observable<any> {
    return this.httpClient.post(uriConfig.API_FACILITIES_CREATE, facilities).pipe(
      
    );
  }

  updateFacilities(uuid: string, facilities: Partial<Facilities>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_FACILITIES_UPDATE(uuid), facilities);
  }

  deleteFacilities(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_FACILITIES_DELETE(uuid));
  }
}
