import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../../uri/config';
import { Product } from './product.type';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private _httpClient = inject(HttpClient);
    private _products: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);
    public products$ = this._products.asObservable();
    //get
    getProducts(): Observable<[Product[], number]> {
    const BASE_URL = ''; 

    return this._httpClient.get<any>(uriConfig.API_GET_PRODUCT).pipe(
        map((res) => {
            const products: Product[] = (res.result ?? []).map((product: any) => ({
                ...product,
                img: product.img?.startsWith('/media')
                    ? `${product.img}`
                    : product.img, 
            }));

            const total: number = res.total_product ?? products.length;
            this._products.next(products);
            return [products, total] as [Product[], number];
        }),
        catchError(() => {
            this._products.next([]);
            return of<[Product[], number]>([[], 0]);
        })
    );
}


//create
    createProduct(payload: any): Observable<Product> {
        return this._httpClient.post<Product>(uriConfig.API_CREATE_PRODUCT, payload).pipe(
            catchError((err) => {
                console.error('Create failed:', err);
                return of(null as any);
            })
        );
    }
// update
    updateProduct(id: number, payload: { title: string; content: string }): Observable<Product> {
        return this._httpClient.put<Product>(uriConfig.API_UPDATE_PRODUCT(id), payload).pipe(
            switchMap((res) => of(res))
        );
    }
// 
    deleteProduct(id: number): Observable<Product> {
        return this._httpClient.delete<Product>(uriConfig.API_DELETE_PRODUCT(id)).pipe(
            switchMap((res) => of(res))
        );
    }
}
