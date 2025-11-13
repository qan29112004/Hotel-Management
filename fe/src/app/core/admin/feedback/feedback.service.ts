import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feedback } from './feedback.types.';
import { uriConfig } from '../../uri/config';
import{ BehaviorSubject, catchError, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
    private _httpClient = inject(HttpClient);

    private _feedbacks: BehaviorSubject<Feedback[]> = new BehaviorSubject<Feedback[]>([]);
    public feedbacks$ = this._feedbacks.asObservable();

    // Get
    getFeedbacks(payload?: any): Observable<[Feedback[], number]> {
        
        return this._httpClient.post<any>(uriConfig.API_GET_FEEDBACK, payload ?? {}).pipe(
            switchMap((res) => {
                const feedbackList = res?.data?.feedback ?? [];
                const total = res?.data?.totalFeedback ?? feedbackList.length;
                this._feedbacks.next(feedbackList);
                return of<[Feedback[], number]>([feedbackList, total]);
            }),
            
            catchError(() => {
                this._feedbacks.next([]);
                return of<[Feedback[], number]>([[], 0]);
            })
        );
    }

    //  Create
    createFeedback(payload: Partial<Feedback>): Observable<Feedback> {
        return this._httpClient.post<any>(uriConfig.API_CREATE_FEEDBACK, payload).pipe(
            switchMap(res => of(res?.data?.feedback))
        );
    }

    //  Update
    updateFeedback(id: number, payload: { title: string; content: string }): Observable<Feedback> {
    return this._httpClient.patch<any>(uriConfig.API_UPDATE_FEEDBACK(id), payload).pipe(
        switchMap(res => of(res?.data?.feedback))
    );
    
}
    //  Delete
    deleteFeedback(id: number): Observable<Feedback> {
        return this._httpClient.delete<any>(uriConfig.API_DELETE_FEEDBACK(id)).pipe(
            switchMap(res => of(res?.data?.feedback))
        );
    }
    // sse

}