import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { KnowlegdeBase } from './content.types';
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
export class KnowlegdeBaseService {
  private knowlegdeBase: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  knowlegdeBase$ = this.knowlegdeBase.asObservable();

  constructor(private httpClient:HttpClient) { }

  check(){
    return this.knowlegdeBase.getValue();
  }

  getAllKnowlegdeBase(params?: any): Observable<{data: KnowlegdeBase[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_KNOWN_LEGDE_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res=>{
        this.knowlegdeBase.next(res.data?.data);
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  getKnowlegdeBase(params?: any): Observable<{data: KnowlegdeBase[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_KNOWN_LEGDE_ALL, params || {}).pipe(
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

  createKnowlegdeBase(knowlegdeBase: Partial<KnowlegdeBase>): Observable<any> {
    return this.httpClient.post(uriConfig.API_KNOWN_LEGDE_CREATE, knowlegdeBase).pipe(
      
    );
  }

  updateKnowlegdeBase(uuid: string, knowlegdeBase: Partial<KnowlegdeBase>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_KNOWN_LEGDE_UPDATE(uuid), knowlegdeBase);
  }

  deleteKnowlegdeBase(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_KNOWN_LEGDE_DELETE(uuid));
  }
}
