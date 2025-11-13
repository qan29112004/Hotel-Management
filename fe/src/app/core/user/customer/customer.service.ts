import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { uriConfig } from 'app/core/uri/config';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import {
    CustomerListPayload,
    CustomerResponse,
    RecordItem,
} from './customer.types';
import { FormGroup } from '@angular/forms';

export interface FilterData {
    status: any[];
    assigned_by: any[];
    department: any[];
    address_provinces_name: any[];
    address_districts_name: any[];
    address_wards_name: any[];
    created_at: any[];
    updated_at: any[];
    source_name: any[];
}
@Injectable({
    providedIn: 'root',
})
export class CustomerService {
    private dynamicForm: any[] | null;
    private table_id: number | null;
    private locateCache: any[] | null;
    private sourceCache: any[] | null;
    private companiesCache: any[] | null;

    private _customers: BehaviorSubject<RecordItem[]> = new BehaviorSubject<
        RecordItem[]
    >([]);
    public customers$ = this._customers.asObservable();

    constructor(private _httpClient: HttpClient) {}

    private _filterForm$ = new BehaviorSubject<FormGroup | null>(null);

    set filterForm(value: FormGroup) {
        this._filterForm$.next(value);
    }

    get filterForm(): FormGroup | null {
        return this._filterForm$.value;
    }

    get filterForm$() {
        return this._filterForm$.asObservable(); // observable để component subscribe
    }

    // private filterDataSubject = new BehaviorSubject<FilterData>({
    //     status: [],
    //     assigned_by: [],
    //     department: [],
    //     address_provinces_name: [],
    //     address_districts_name: [],
    //     address_wards_name: [],
    //     created_at: [],
    //     updated_at: [],
    //     source_name: [],
    // });

    // filterData$ = this.filterDataSubject.asObservable();

    // updateFilter(newFilter: Partial<FilterData>) {
    //     const current = this.filterDataSubject.value;
    //     this.filterDataSubject.next({ ...current, ...newFilter });
    // }

    // resetFilter() {
    //     this.filterDataSubject.next({
    //         status: [],
    //         assigned_by: [],
    //         department: [],
    //         address_provinces_name: [],
    //         address_districts_name: [],
    //         address_wards_name: [],
    //         created_at: [],
    //         updated_at: [],
    //         source_name: [],
    //     });
    // }
    getDynamicForm(table_id: number): Observable<any[]> {
        // if (this.dynamicForm && this.table_id) {
        //     return of(this.dynamicForm);
        // }
        return this._httpClient
            .get<any[]>(uriConfig.API_FORM_CUSTOMER + table_id)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: any) => {
                    this.dynamicForm = response.data.sections;
                    this.table_id = response.data.id;
                    return of(response.data.sections);
                })
            );
    }

    getCustomerList(
        payload: CustomerListPayload
    ): Observable<CustomerResponse> {
        return this._httpClient
            .post<CustomerResponse>(uriConfig.API_GET_CUSTOMER, payload)
            .pipe(
                switchMap((response: CustomerResponse) => {
                    if (response?.data?.records) {
                        this._customers.next(response.data.records);
                    }
                    return of(response);
                })
            );
    }

    createCustomer(data: any): Observable<any> {
        return this._httpClient
            .post<any>(uriConfig.API_CREATE_CUSTOMER, {
                table_id: this.table_id,
                data: data,
            })
            .pipe(
                switchMap((response: any) => {
                    return of(response);
                })
            );
    }
    getLocate(): Observable<any> {
        // Nếu đã có dữ liệu trong cache thì trả về luôn
        if (this.locateCache) {
            return of(this.locateCache);
        }

        // Nếu chưa có thì gọi API và lưu vào cache
        return this._httpClient.get<any[]>(uriConfig.API_GET_LOCATE).pipe(
            catchError(() => of(false)),
            switchMap((response: any) => {
                this.locateCache = response.data;
                return of(response.data);
            })
        );
    }
    getSource(): Observable<any> {
        // Nếu đã có dữ liệu trong cache thì trả về luôn
        if (this.sourceCache) {
            return of(this.sourceCache);
        }

        // Nếu chưa có thì gọi API và lưu vào cache
        return this._httpClient.get<any[]>(uriConfig.API_GET_SOURCE).pipe(
            catchError(() => of(false)),
            switchMap((response: any) => {
                this.sourceCache = response.data;
                return of(response.data);
            })
        );
    }
    getCompanies(): Observable<any> {
        // Nếu đã có dữ liệu trong cache thì trả về luôn
        if (this.companiesCache) {
            return of(this.companiesCache);
        }

        // Nếu chưa có thì gọi API và lưu vào cache
        return this._httpClient.get<any[]>(uriConfig.API_GET_COMPANINES).pipe(
            catchError(() => of(false)),
            switchMap((response: any) => {
                this.companiesCache = response.data;
                return of(response.data);
            })
        );
    }

    updateCustomer(id: number, data: any): Observable<any> {
        const body = { record_id: id };
        return this._httpClient
            .post<any>(`${uriConfig.API_UPDATE_CUSTOMER}${id}/`, {
                table_id: this.table_id,
                data: data,
                body: body,
            })
            .pipe(switchMap((response: any) => of(response)));
    }

    deleteCustomers(ids: number[]): Observable<any> {
        const url = uriConfig.API_DELETE_CUSTOMER;
        const body = { record_ids: ids };
        return this._httpClient.post(url, body);
    }

    getCustomerDetail(id: number): Observable<any> {
        const body = { record_id: id };

        return this._httpClient
            .post<any>(`${uriConfig.API_DETAIL_CUSTOMER}`, body)
            .pipe(switchMap((response: any) => of(response)));
    }

    importExcelFile(formData: FormData): Observable<any> {
        return this._httpClient
            .post<any>(uriConfig.API_IMPORT_CUSTOMER, formData)
            .pipe(
                switchMap((response: any) => {
                    return of(response);
                })
            );
    }

    exportExcelFile(): Observable<any> {
        return this._httpClient.get<any>(uriConfig.API_EXPORT_CUSTOMER).pipe(
            switchMap((response: any) => {
                return of(response);
            })
        );
    }
}
