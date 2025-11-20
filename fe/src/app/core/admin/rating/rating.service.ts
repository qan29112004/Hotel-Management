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
export class RatingService {

  constructor(private httpClient: HttpClient) { }
  getRating(param:any):Observable<{data: any[], total: number, page: number, page_size: number}>{
    return this.httpClient.post<any>(uriConfig.API_RATING_ALL, param).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      
    )
  }
  createRating(rating:any): Observable<any>{
    return this.httpClient.post<any>(uriConfig.API_RATING_CREATE, rating);
  }

  updateRating(uuid:string, rating: Partial<any>): Observable<any>{
    return this.httpClient.patch(uriConfig.API_RATING_UPDATE(uuid), rating)
  }

  deleteRating(uuid:string):Observable<any>{
    return this.httpClient.delete(uriConfig.API_RATING_DELETE(uuid));
  }
}
