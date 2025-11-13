import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { FieldConfig, FieldResponse, FormTemplateResponse, FormTemplateRequest, FormResponse, FormTemplate } from './custom-form-template.types';

@Injectable({ providedIn: 'root' })
export class CustomFormTemplateService {
    private _httpClient = inject(HttpClient);

    private _forms: BehaviorSubject<FormTemplate[]> = new BehaviorSubject<FormTemplate[]>([]);
    public forms$ = this._forms.asObservable();

    private _fields: BehaviorSubject<FieldConfig[]> = new BehaviorSubject<FieldConfig[]>([]);
    public fields$ = this._fields.asObservable();

    private _itemForm = new BehaviorSubject<any>(null);
    itemForm$ = this._itemForm.asObservable();

    private _itemField = new BehaviorSubject<any>(null);
    itemField$ = this._itemField.asObservable();

    setItemTable(table: any): void {
        this._itemForm.next(table);
    }

    clearItemTable(): void {
        this._itemForm.next(null);
    }

    /**
     * create the form
     *
     * @param form
     */
    getForms(payload: any): Observable<FormResponse> {
        return this._httpClient
            .post<FormResponse>(uriConfig.API_GET_FORM, payload)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: FormResponse) => {
                    if (response && response.data.tables) {
                        this._forms.next(response.data.tables); // cập nhật vào bộ nhớ
                    }
                    return of(response);
                })
            );
    }

    getFormById(id: number): Observable<FormTemplateResponse> {
        return this._httpClient
            .get<FormTemplateResponse>(`${uriConfig.API_GET_FORM}${id}/`)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: FormTemplateResponse) => {
                    if (response && response.data) {
                        this._forms.next(response.data); // cập nhật vào bộ nhớ
                    }
                    return of(response);
                })
            );
    }

    getFields(): Observable<FieldResponse> {
        return this._httpClient
            .get<FieldResponse>(uriConfig.API_GET_FIELD)
            .pipe(
                catchError(() => of(false)),
                switchMap((response: FieldResponse) => {
                    if (response && response.data) {
                        this._fields.next(response.data);
                    }
                    return of(response);
                })
            )
    }

    createForm(form: any): Observable<any> {
        return this._httpClient.post(uriConfig.API_CREATE_FORM, form).pipe(
            // catchError(() => of(false)),
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    updateForm(id: number, form: any): Observable<any> {
        return this._httpClient.put(`${uriConfig.API_UPDATE_FORM}${id}/`, form).pipe(
            // catchError(() => of(false)),
            switchMap((response: any) => {
                return of(response);
            })
        );
    }

    updateFormTemplate(id: number, formTemplate: FormTemplateRequest[]): Observable<any> {
        return this._httpClient
            .put(`${uriConfig.API_UPDATE_FORM_TEMPLATE}${id}/`, formTemplate)
            .pipe(
                switchMap((response: any) => {
                    return of(response);
                })
            );
    }
}