import { Injectable } from '@angular/core';
import { uriConfig } from 'app/core/uri/config';
import { HttpClient } from '@angular/common/http';
import { pipe, map, tap, Subject, Observable, of, catchError,BehaviorSubject } from 'rxjs';
import { Offer } from './offer.type';
@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private offer: BehaviorSubject<Offer[]> = new BehaviorSubject<Offer[]>([]);
  offer$ = this.offer.asObservable()

  check(){
    return this.offer.getValue();
  }

  constructor(private http:HttpClient) { }
  getOffer(params?: any): Observable<{data: Offer[], total: number, page: number, page_size: number}> {
      return this.http.post<any>(uriConfig.API_OFFER_ALL, params || {}).pipe(
        map(res => ({
          data: res.data?.data || [],
          total: res.data?.total,
          page: res.data?.page,
          page_size: res.data?.page_size
        })),
        tap(res=>{
          this.offer.next(res.data?.data);
        }),
        catchError(error => {
          console.error('Error fetching amenities:', error);
          return of({ data: [], total: 0, page: 1, page_size: 10 });
        })
      );
    }
  
    createOffer(offer: Partial<Offer>): Observable<any> {
      return this.http.post(uriConfig.API_OFFER_CREATE, offer).pipe(
        
      );
    }
  
    updateOffer(uuid: string, offer: Partial<Offer>): Observable<any> {
      return this.http.patch(uriConfig.API_OFFER_UPDATE(uuid), offer);
    }
  
    deleteOffer(uuid: string): Observable<any> {
      return this.http.delete(uriConfig.API_OFFER_DELETE(uuid));
    }

}
