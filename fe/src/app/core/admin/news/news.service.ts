import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, map } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { News, Status, NewsComment } from './news.types';
import { environment } from 'environments/environment';

export interface CreateNewsRequest extends Partial<News> {
    image_urls?: string[];
    attachment_items?: { file: string; filename?: string }[];
}

@Injectable({ providedIn: 'root' })
export class NewsService {
    private _httpClient = inject(HttpClient);
    private _news: BehaviorSubject<News[]> = new BehaviorSubject<News[]>([]);
    private _comment: BehaviorSubject<NewsComment[]> = new BehaviorSubject<NewsComment[]>([]);
    public news$ = this._news.asObservable();
    public mediaUrl = environment.mediaUrl;

    getAllNews(payload: any): Observable<[News[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_NEWS, payload)
            .pipe(
                switchMap((res) => {
                    const totalNews = res?.data?.totalNews ?? 0;
                    const news = res?.data?.news ?? [];
                    this._news.next(news);
                    return of<[News[], number]>([news, totalNews]);
                }),
                catchError(() => {
                    this._news.next([]);
                    return of<[News[], number]>([[], 0]);
                })
            );
        }
        

    getNews(payload: any): Observable<[News[], number]> {
        return this._httpClient.post<any>(uriConfig.API_NEWS_ACCEPT, payload)
            .pipe(
                switchMap((res) => {
                    const totalNews = res?.data?.totalNews ?? 0;
                    const news = res?.data?.news ?? [];
                    this._news.next(news);
                    return of<[News[], number]>([news, totalNews]);
                }),
                catchError(() => {
                    this._news.next([]);
                    return of<[News[], number]>([[], 0]);
                })
            );
        }

    getNewsByCategory(payload: any): Observable<[News[], number]> {
        return this._httpClient.post<any>(uriConfig.API_GET_NEWS_BY_CATEGORY, payload)
            .pipe(
                switchMap((res) => {
                    const totalNews = res?.data?.totalNews ?? 0;
                    const news = res?.data?.news ?? [];
                    this._news.next(news);
                    return of<[News[], number]>([news, totalNews]);
                }),
                catchError(() => {
                    this._news.next([]);
                    return of<[News[], number]>([[], 0]);
                })
            );
        }

    // createNews(payload: News): Observable<any> {
    //     return this._httpClient.post<any>(uriConfig.API_CREATE_NEWS, payload).pipe(
    //         switchMap(res => of(res?.data))
    //     );
    // }
    
    createNews(payload: CreateNewsRequest): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_CREATE_NEWS, payload).pipe(
            switchMap(res => of(res?.data))
        );
    }
    

    getNewsById(id: number): Observable<News> {
        return this._httpClient.get<any>(`${uriConfig.API_GET_NEWS_DETAIL_BY_ID(id)}`).pipe(
            switchMap(res => of(res?.data))
        );
    }

    getNewsBySlug(slug: string): Observable<News> {
        return this._httpClient.get<any>(`${uriConfig.API_GET_NEWS_DETAIL_BY_SLUG(slug)}`).pipe(
            switchMap(res => of(res?.data))
        );
    }

    updateNews(id: number, payload: Partial<News>): Observable<News> {
        return this._httpClient.patch<any>(`${uriConfig.API_UPDATE_NEWS(id)}`, payload).pipe(
            switchMap(res => of(res?.data))
        );
    }

    deleteNews(id: number): Observable<News> {
        return this._httpClient.delete<any>(`${uriConfig.API_DELETE_NEWS(id)}`).pipe(
            switchMap(res => of(res?.data?.news))
        );
    }


    uploadImage(payload: any): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_UPLOAD_IMAGE, payload).pipe(
            map((response: any) => {
                // Nếu response trả về là relative path, thêm domain
                if (response.data?.url && !response.data.url.startsWith('http')) {
                    response.data.url = `${this.mediaUrl}${response.data.url}`;
                }
                return response;
            })
            // switchMap(res => of(res))
        );
    }

    uploadFile(payload: any): Observable<any> {
        return this._httpClient.post<any>(uriConfig.API_UPLOAD_FILE, payload).pipe(
            map((response: any) => {
                // Nếu response trả về là relative path, thêm domain
                if (response.data?.url && !response.data.url.startsWith('http')) {
                    response.data.url = `${this.mediaUrl}${response.data.url}`;
                }
                return response;
            })
            // switchMap(res => of(res))
        );
    }

    likeNews(id: number): Observable<any> {
        return this._httpClient.post<any>(`${uriConfig.API_LIKE_NEWS(id)}`, {}).pipe(
            switchMap(res => of(res.message))
        );
    }

    getCommentNews(id: number): Observable<[NewsComment[], number]> {
        return this._httpClient.get<any>(`${uriConfig.API_GET_NEWS_COMMENT(id)}`)
            .pipe(
                switchMap((res) => {
                    const total = res?.data?.total ?? 0;
                    const comment = res?.data?.comment ?? [];
                    this._comment.next(comment);
                    return of<[NewsComment[], number]>([comment, total]);
                }),
                catchError(() => {
                    this._comment.next([]);
                    return of<[NewsComment[], number]>([[], 0]);
                })
            );
    }

    commentNews(id: number, payload: Partial<NewsComment>): Observable<any> {
        return this._httpClient.post<any>(`${uriConfig.API_COMMENT_NEWS(id)}`, payload).pipe(
            switchMap(res => of(res?.data))
        );
    }

    likeComment(id: number): Observable<any> {
        return this._httpClient.post<any>(`${uriConfig.API_LIKE_COMMENT(id)}`, {}).pipe(
            switchMap(res => of(res.message))
        );
    }

    getStatus(): Status[] {
        return [
            {
                id: 1,
                name: 'waiting',
                class: 'bg-amber-100 text-amber-700',
                is_list: false,
            },
            {
                id: 2,
                name: 'accept',
                class: 'bg-emerald-100 text-emerald-700',
                is_list: true,
            },
            {
                id: 3,
                name: 'reject',
                class: 'bg-red-100 text-red-700',
                is_list: false,
            },
        ];
    }
}