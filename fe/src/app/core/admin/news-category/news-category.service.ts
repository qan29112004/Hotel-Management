import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { NewsCategory } from './news-category.types';

@Injectable({ providedIn: 'root' })
export class NewsCategoryService {
    private _httpClient = inject(HttpClient);
    private _newsCategories: BehaviorSubject<NewsCategory[]> = new BehaviorSubject<NewsCategory[]>([]);
    public newsCategories$ = this._newsCategories.asObservable();

    getNewsCategories(payload: any): Observable<[NewsCategory[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_NEWS_CATEGORY, payload)
            .pipe(
                switchMap((res) => {
                    const categories_parent = res?.data?.newsCategoriesParent ?? [];
                    const totalNewsCategory = res?.data?.totalNewsCategory ?? 0;
                    this._newsCategories.next(categories_parent);
                    return of<[NewsCategory[], number]>([categories_parent, totalNewsCategory]);
                }),
                catchError(() => {
                    this._newsCategories.next([]);
                    return of<[NewsCategory[], number]>([[], 0]);
                })
            );
        }
    
    //create
    createNewsCategory(payload: { name: string; slug: string; category_parent: number }): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_CREATE_NEWS_CATEGORY, payload).pipe(
            switchMap(res => of(res))
        );
    }

    //update
    updateNewsCategory(id: number, payload: { name: string; slug: string }): Observable<NewsCategory> {
        return this._httpClient.patch<any>(uriConfig.API_UPDATE_NEWS_CATEGORY(id), payload).pipe(
            switchMap(res => of(res?.data?.category))
        );
    }

    //delete
    deleteNewsCategory(id: number): Observable<NewsCategory> {
        return this._httpClient.delete<any>(uriConfig.API_DELETE_NEWS_CATEGORY(id), {}).pipe(
            switchMap(res => of(res?.data?.category))
        );
    }

}