import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { Payment } from './payment.types';
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
export class PaymentService {
  private payment: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  payment$ = this.payment.asObservable();

  constructor(private httpClient: HttpClient) { }

  check() {
    return this.payment.getValue();
  }

  getAllPayment(params?: any): Observable<{ data: Payment[], total: number, page: number, page_size: number }> {
    return this.httpClient.post<any>(uriConfig.API_PAYMENT_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap(res => {
        this.payment.next(res.data?.data);
      }),
      catchError(error => {
        console.error('Error fetching amenities:', error);
        return of({ data: [], total: 0, page: 1, page_size: 10 });
      })
    );
  }

  getPayment(params?: any): Observable<{ data: Payment[], total: number, page: number, page_size: number }> {
    return this.httpClient.post<any>(uriConfig.API_PAYMENT_ALL, params || {}).pipe(
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

  createPayment(payment: Partial<Payment>): Observable<any> {
    return this.httpClient.post(uriConfig.API_PAYMENT_CREATE, payment).pipe(

    );
  }

  updatePayment(uuid: string, payment: Partial<Payment>): Observable<any> {
    return this.httpClient.patch(uriConfig.API_PAYMENT_UPDATE(uuid), payment);
  }

  deletePayment(uuid: string): Observable<any> {
    return this.httpClient.delete(uriConfig.API_PAYMENT_DELETE(uuid));
  }
}
