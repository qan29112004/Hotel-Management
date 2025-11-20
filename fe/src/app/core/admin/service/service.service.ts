import { Injectable } from '@angular/core';
import { uriConfig } from 'app/core/uri/config';
import { HttpClient } from '@angular/common/http';
import { pipe, map, tap, Subject, Observable, of, catchError,BehaviorSubject } from 'rxjs';
import { Service } from './service.type';
@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private service: BehaviorSubject<Service[]> = new BehaviorSubject<Service[]>([]);
  service$ = this.service.asObservable()

  check(){
    return this.service.getValue();
  }

  constructor(private http:HttpClient) { }

  getAllService(params?: any): Observable<{data: Service[], total: number, page: number, page_size: number}> {
      return this.http.post<any>(uriConfig.API_SERVICE_ALL, params || {}).pipe(
        map(res => ({
          data: res.data?.data || [],
          total: res.data?.total,
          page: res.data?.page,
          page_size: res.data?.page_size
        })),
        tap(res=>{
          this.service.next(res.data?.data);
        }),
        catchError(error => {
          console.error('Error fetching amenities:', error);
          return of({ data: [], total: 0, page: 1, page_size: 10 });
        })
      );
    }

  getService(params?: any): Observable<{data: Service[], total: number, page: number, page_size: number}> {
      return this.http.post<any>(uriConfig.API_SERVICE_ALL, params || {}).pipe(
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
  
    createService(service: Partial<Service>): Observable<any> {
      return this.http.post(uriConfig.API_SERVICE_CREATE, service).pipe(
        
      );
    }
  
    updateService(uuid: string, service: Partial<Service>): Observable<any> {
      return this.http.patch(uriConfig.API_SERVICE_UPDATE(uuid), service);
    }
  
    deleteService(uuid: string): Observable<any> {
      return this.http.delete(uriConfig.API_SERVICE_DELETE(uuid));
    }

    addOrUpdateServiceToHoldRoom(payload:any):Observable<any>{
      return this.http.post<any>(uriConfig.API_ADD_UPDATE_SERVICE_BOOKING, payload)
    }
}
