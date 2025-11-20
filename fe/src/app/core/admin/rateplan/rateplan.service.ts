import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import {
  BehaviorSubject,
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    switchMap,
    tap,
} from 'rxjs';
import { RatePlan } from './rateplan.type';

@Injectable({
  providedIn: 'root'
})
export class RateplanService {
  private ratePlan: BehaviorSubject<{data:RatePlan[],total:number}> = new BehaviorSubject<{data:RatePlan[],total:number}>(null);
  ratePlan$ = this.ratePlan.asObservable()

  check(){
    return this.ratePlan.getValue();
  }

  constructor(private http:HttpClient) { }
  getAllRatePlan(params?: any): Observable<{data: RatePlan[], total: number, page: number, page_size: number}> {
    return this.http.post<any>(uriConfig.API_RATE_PLAN_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res=>{
        this.ratePlan.next({data:res.data?.data, total:res.total});
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  getRatePlan(params?: any): Observable<{data: RatePlan[], total: number, page: number, page_size: number}> {
    return this.http.post<any>(uriConfig.API_RATE_PLAN_ALL, params || {}).pipe(
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

  createRatePlan(ratePlan: Partial<RatePlan>): Observable<any> {
    return this.http.post(uriConfig.API_RATE_PLAN_CREATE, ratePlan).pipe(
      
    );
  }

  updateRatePlan(uuid: string, ratePlan: Partial<RatePlan>): Observable<any> {
    return this.http.patch(uriConfig.API_RATE_PLAN_UPDATE(uuid), ratePlan);
  }

  deleteRatePlan(uuid: string): Observable<any> {
    return this.http.delete(uriConfig.API_RATE_PLAN_DELETE(uuid));
  }
}
