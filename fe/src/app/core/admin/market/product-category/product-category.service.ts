import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../../uri/config';
import { ProductCategory, Status } from './product-category.types';

@Injectable({ providedIn: 'root' })
export class ProductCategoryService {
    private _httpClient = inject(HttpClient);
    private _productCategories: BehaviorSubject<ProductCategory[]> = new BehaviorSubject<ProductCategory[]>([]);
    public productCategories$ = this._productCategories.asObservable();

    getProductCategories(payload: any): Observable<[ProductCategory[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_PRODUCT_CATEGORY, payload)
            .pipe(
                switchMap((res) => {
                    const categories_parent = res?.data?.productCategoriesParent ?? [];
                    const totalProductCategory = res?.data?.totalProductCategory ?? 0;
                    this._productCategories.next(categories_parent);
                    return of<[ProductCategory[], number]>([categories_parent, totalProductCategory]);
                }),
                catchError(() => {
                    this._productCategories.next([]);
                    return of<[ProductCategory[], number]>([[], 0]);
                })
            );
        }
    
    //create
    createProductCategory(payload: { name: string; slug: string; category_parent: number }): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_CREATE_PRODUCT_CATEGORY, payload).pipe(
            switchMap(res => of(res))
        );
    }

    //update
    updateProductCategory(id: number, payload: Partial<ProductCategory>): Observable<ProductCategory> {
        return this._httpClient.patch<any>(uriConfig.API_UPDATE_PRODUCT_CATEGORY(id), payload).pipe(
            switchMap(res => of(res?.data?.category))
        );
    }

    //delete
    deleteProductCategory(id: number): Observable<ProductCategory> {
        return this._httpClient.delete<any>(uriConfig.API_DELETE_PRODUCT_CATEGORY(id), {}).pipe(
            switchMap(res => of(res?.data?.category))
        );
    }

    getStatus(): Status[] {
        return [
            {
                id: 1,
                name: 'display',
                class: 'bg-emerald-100 text-emerald-700',
                is_list: false,
            },
            {
                id: 2,
                name: 'hide',
                class: 'bg-amber-100 text-amber-700',
                is_list: true,
            }
        ];
    }
}