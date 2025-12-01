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

  getDashboardOverview(): Observable<any> {
    return this._httpClient.get<any>(uriConfig.API_DASHBOARD_OVERVIEW);
  }
}
