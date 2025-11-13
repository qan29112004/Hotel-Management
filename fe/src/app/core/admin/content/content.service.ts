import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';
import { uriConfig } from '../../uri/config';
import { Content } from './content.types';
@Injectable({ providedIn: 'root' })
export class ContentService {
    private _httpClient = inject(HttpClient);
    private _contents: BehaviorSubject<Content[]> = new BehaviorSubject<
        Content[]
    >([]);
    public contents$ = this._contents.asObservable();

    getContents(): Observable<{ total_content: number; result: Content[] }> {
        return this._httpClient.get<any>(uriConfig.API_GET_CONTENT).pipe(
            switchMap((res) => {
                const result = res.result ?? [];
                const total_content = res.total_content ?? result.length;
                this._contents.next(result);
                return of({ total_content, result });
            }),
            catchError(() => {
                this._contents.next([]);
                return of({ total_content: 0, result: [] });
            })
        );
    }
    getContentById(id: number) {
        return this._httpClient.get(`/api/content/${id}/`);
    }
    createContents(payload: {
        title: string;
        content: string;
    }): Observable<Content> {
        return this._httpClient
            .post<Content>(uriConfig.API_CREATE_CONTENT, payload)
            .pipe(
                catchError((err) => {
                    console.error('Create failed:', err);
                    return of(null as any);
                })
            );
    }
    updateContent(
        id: number,
        payload: { title: string; content: string }
    ): Observable<Content> {
        return this._httpClient
            .put<any>(uriConfig.API_UPDATE_CONTENT(id), payload)
            .pipe(switchMap((res) => of(res)));
    }
    deleteContent(id: number): Observable<Content> {
        return this._httpClient
            .delete<any>(uriConfig.API_DELETE_CONTENT(id))
            .pipe(switchMap((res) => of(res)));
    }
    filterContents(
        payload: any
    ): Observable<{ total: number; result: Content[] }> {
        return this._httpClient
            .post<any>(uriConfig.API_FILTER_CONTENT, payload)
            .pipe(
                switchMap((res) => {
                    const result = res.result ?? [];
                    const total = res.total ?? result.length;
                    return of({ total, result });
                }),
                catchError((error) => {
                    console.error('Lọc nội dung thất bại:', error);
                    return of({ total: 0, result: [] });
                })
            );
    }
    // content.service.ts
    getTrainingStatusUpdates(): Observable<any> {
        return new Observable((observer) => {
            const eventSource = new EventSource(
                uriConfig.API_CHATBOT_TRAINING_STATUS
            );

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('SSE message received:', data);
                observer.next(data);
            };

            eventSource.onerror = (error) => {
                eventSource.close();
            };

            return () => {
                eventSource.close();
            };
        });
    }

    //Training start
    startTraining(): Observable<any> {
        return this._httpClient.post(uriConfig.API_CHATBOT_START_TRAINING, {});
    }
}
