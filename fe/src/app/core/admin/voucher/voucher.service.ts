import { Injectable } from '@angular/core';
import { uriConfig } from 'app/core/uri/config';
import { HttpClient } from '@angular/common/http';
import { pipe, map, tap, Subject, Observable, of, catchError,BehaviorSubject } from 'rxjs';
import { Voucher, PreviewVoucher, ApplyVoucher, RedeemVoucher, RevertVoucher } from './voucher.type';
@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private voucher: BehaviorSubject<Voucher[]> = new BehaviorSubject<Voucher[]>([]);
  voucher$ = this.voucher.asObservable

  check(){
    return this.voucher.getValue()
  }
  constructor(private http: HttpClient) { }
  getAllVoucher(params?: any): Observable<{data: Voucher[], total: number, page: number, page_size: number}> {
      return this.http.post<any>(uriConfig.API_VOUCHER_ALL, params || {}).pipe(
        map(res => ({
          data: res.data?.data || [],
          total: res.data?.total,
          page: res.data?.page,
          page_size: res.data?.page_size
        })),
        tap(res=>{
          this.voucher.next(res.data?.data);
        }),
        catchError(error => {
          console.error('Error fetching amenities:', error);
          return of({ data: [], total: 0, page: 1, page_size: 10 });
        })
      );
    }

  getVoucher(params?: any): Observable<{data: Voucher[], total: number, page: number, page_size: number}> {
    return this.http.post<any>(uriConfig.API_VOUCHER_ALL, params || {}).pipe(
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

  createVoucher(voucher: Partial<Voucher>): Observable<any> {
    return this.http.post(uriConfig.API_VOUCHER_CREATE, voucher).pipe(
      
    );
  }

  updateVoucher(uuid: string, voucher: Partial<Voucher>): Observable<any> {
    return this.http.patch(uriConfig.API_VOUCHER_UPDATE(uuid), voucher);
  }

  deleteVoucher(uuid: string): Observable<any> {
    return this.http.delete(uriConfig.API_VOUCHER_DELETE(uuid));
  }
  claimVoucher(payload:any): Observable<any>{
    return this.http.post<any>(uriConfig.API_VOUCHER_CLAIM,payload).pipe(
      map(res=>({
        data: res.data
      }))
    )
  }

  listMyVoucher():Observable<any>{
    return this.http.get<any>(uriConfig.API_VOUCHER_MY).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }

  previewVoucher(payload:PreviewVoucher):Observable<any>{
    return this.http.post<any>(uriConfig.API_VOUCHER_PREVIEW,payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }

  applyVoucher(payload:ApplyVoucher):Observable<any>{
    return this.http.post<any>(uriConfig.API_VOUCHER_APPLY, payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }
  redeemVoucher(payload:RedeemVoucher):Observable<any>{
    return this.http.post<any>(uriConfig.API_VOUCHER_REDEEM,payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }
  revertVoucher(payload:RevertVoucher):Observable<any>{
    return this.http.post<any>(uriConfig.API_VOUCHER_REVERT,payload).pipe(
      map(res=>({
        data:res.data
      }))
    )
  }
  // API_VOUCHER_CLAIM: baseUrl + '/api/voucher/claim/',
  //   API_VOUCHER_MY: baseUrl + '/api/voucher/my/',
  //   API_VOUCHER_PREVIEW : baseUrl + '/api/voucher/preview/',
  //   API_VOUCHER_REDEEM : baseUrl + '/api/voucher/redeem/',
  //   API_VOUCHER_REVERT : baseUrl + '/api/voucher/revert/'
  
}
