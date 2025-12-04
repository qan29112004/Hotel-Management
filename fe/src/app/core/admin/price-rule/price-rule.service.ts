import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { PriceRule } from './price-rule.types';
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
export class PriceRuleService {
  private priceRule: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  priceRule$ = this.priceRule.asObservable();

  constructor(private httpClient:HttpClient) { }

  check(){
    return this.priceRule.getValue();
  }

  getAllPriceRule(params?: any): Observable<{data: PriceRule[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_PRICE_RULE_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res=>{
        this.priceRule.next(res.data?.data);
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  getPriceRule(params?: any): Observable<{data: PriceRule[], total: number, page: number, page_size: number}> {
    return this.httpClient.post<any>(uriConfig.API_PRICE_RULE_ALL, params || {}).pipe(
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

  createPriceRule(priceRule: Partial<PriceRule>): Observable<any> {
    return this.httpClient.post(uriConfig.API_PRICE_RULE_CREATE, priceRule).pipe(
      
    );
  }

  updatePriceRule(uuid: string, priceRule: Partial<PriceRule>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_PRICE_RULE_UPDATE(uuid), priceRule);
  }

  deletePriceRule(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_PRICE_RULE_DELETE(uuid));
  }
}
