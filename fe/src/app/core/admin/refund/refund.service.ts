import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { Refund } from './refund.types';
import {
    catchError,
    map,
    Observable,
    of,
    BehaviorSubject,
} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RefundService {
    private refund: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    refund$ = this.refund.asObservable();

    constructor(private httpClient: HttpClient) { }

    getAllRefund(params?: any): Observable<{ data: Refund[], total: number, page: number, page_size: number }> {
        return this.httpClient.post<any>(uriConfig.API_REFUND_ALL, params || {}).pipe(
            map(res => ({
                data: res.data?.data || [],
                total: res.data?.total,
                page: res.data?.page,
                page_size: res.data?.page_size
            })),
            catchError(error => {
                console.error('Error fetching refunds:', error);
                return of({ data: [], total: 0, page: 1, page_size: 10 });
            })
        );
    }

    updateRefund(uuid: string, refund: Partial<Refund>): Observable<any> {
        return this.httpClient.patch(uriConfig.API_REFUND_UPDATE(uuid), refund);
    }

    deleteRefund(uuid: string): Observable<any> {
        return this.httpClient.delete(uriConfig.API_REFUND_DELETE(uuid));
    }
}
