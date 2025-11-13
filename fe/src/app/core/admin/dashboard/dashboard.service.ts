import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { catchError, Observable, of, retry, switchMap } from 'rxjs';
import { DashBoard } from './dashboard.types';
import { User } from './dashboard.types';
import { Post } from './dashboard.types';
@Injectable({
  providedIn: 'root'
})
export class DashBoardService {
  private _httpClient = inject(HttpClient);

 getTraffic(payload?: any): Observable<[DashBoard[], number]> {
  return this._httpClient.get<any[]>(uriConfig.API_GET_DASHBOARD, { params: payload }).pipe(
    switchMap((res) => {
      const data = res ?? [];
      const mapped: DashBoard[] = data.map(item => ({
        year: item.year,
        month: item.month,
        totalUserLogin: item.total_user_login,
        created_at: item.created_at
      }));
      const total = mapped.length;
      return of<[DashBoard[], number]>([mapped, total]);
    }),
    catchError((error) => {
      return of<[DashBoard[], number]>([[], 0]);
    })
  );
}
getRecentRegistered(): Observable<User[]> {
  return this._httpClient.get<User[]>(uriConfig.API_GET_RECENT_REG)
}
getNumberOffLike(): Observable<Post[]> {
  return this._httpClient.get<Post[]>(uriConfig.API_GET_NUMBER_OF_LIKE)
}
getdashboardsse():Observable<any>{
  return new Observable(Observable => {
    const source = new EventSource(uriConfig.API_DASHBOARD_SSE);
    source.onmessage = (event) =>
    {
      try{
        const data = JSON.parse(event.data)
        Observable.next(data)
      }
      catch(err){
        Observable.error(err)
      }
    };
    source.onerror = (err)=>
    {
      Observable.error(err) ; 
      source.close() ;
    };
    return() =>{
      source.close()
    };
  });

}
}
