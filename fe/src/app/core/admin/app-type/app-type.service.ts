import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { AppType, Industry, Status } from './app-type.types';

@Injectable({ providedIn: 'root' })
export class AppTypeService {
    private _httpClient = inject(HttpClient);
    private _appTypes: BehaviorSubject<AppType[]> = new BehaviorSubject<AppType[]>([]);
    public appTypes$ = this._appTypes.asObservable();

    getAppTypes(): Observable<AppType[]> {
        return this._httpClient.get<any>(uriConfig.API_GET_APP_TYPE)
            .pipe(
                switchMap((res) => {
                    const appTypes = res?.data ?? [];
                    this._appTypes.next(appTypes);
                    console.log(appTypes)
                    return [appTypes];
                }),
                catchError((error) => {
                    console.error('Error fetching app types:', error);
                    return of([[], 0]);
                })
            );
    }

    getAllApp(payload: any): Observable<[AppType[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_ALL_APP, payload)
            .pipe(
                switchMap((res) => {
                    const total = res?.data?.total ?? 0;
                    const app_types = res?.data?.appTypes ?? [];
                    this._appTypes.next(app_types);
                    return of<[AppType[], number]>([app_types, total]);
                }),
                catchError(() => {
                    this._appTypes.next([]);
                    return of<[AppType[], number]>([[], 0]);
                })
            );
        }

    createApp(payload: Partial<AppType>): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_CREATE_APP_TYPE, payload).pipe(
            switchMap(res => of(res))
        );
    }

    updateApp(id: number, payload: Partial<AppType>): Observable<AppType> {
        return this._httpClient.patch<any>(`${uriConfig.API_UPDATE_APP_TYPE(id)}`, payload).pipe(
            switchMap(res => of(res?.data))
        );
    }

    deleteApp(id: number): Observable<AppType> {
        return this._httpClient.delete<any>(uriConfig.API_DELETE_APP_TYPE(id), {}).pipe(
            switchMap(res => of(res?.data))
        );
    }

    lockMultipleApps(appIds: number[], lock: boolean): Observable<any> {
        return this._httpClient.patch(uriConfig.API_LOCK_SELECTED_APPS, { app_ids: appIds, lock: lock });
    }
    
    getStatus(): Status[] {
        return [
            {
                id: 1,
                name: 'active',
                class: 'bg-emerald-100 text-emerald-700',
                is_list: false,
            },
            {
                id: 2,
                name: 'inactive',
                class: 'bg-amber-100 text-amber-700',
                is_list: true,
            },
            {
                id: 3,
                name: 'disconnect',
                class: 'bg-red-100 text-red-700',
                is_list: false,
            },
        ];
    }


    getIndustry(): Industry[] {
        return [
            {
                id: 1,
                name: 'finance_accounting',
                class: 'bg-emerald-100 text-emerald-700'
            },
            {
                id: 2,
                name: 'marketing_sales',
                class: 'bg-amber-100 text-amber-700'
            },
            {
                id: 3,
                name: 'hrm',
                class: 'bg-blue-100 text-blue-700'
            },
            {
                id: 4,
                name: 'digital',
                class: 'bg-purple-100 text-purple-700'
            },
        ];
    }
}