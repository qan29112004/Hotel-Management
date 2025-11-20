import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from '../../uri/config';
import { 
  Destination, 
  DestinationResponse, 
  DestinationCreateRequest, 
  DestinationUpdateRequest 
} from './destination.type';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    switchMap,
    tap,
    BehaviorSubject,
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DestinationService {
  // Global state for destinations
  private _destinations: BehaviorSubject<DestinationResponse | null> = new BehaviorSubject<DestinationResponse | null>(null);

  constructor(private http: HttpClient) { }

  /**
   * Get the cached destinations as an Observable
   */
  get destinations$(): Observable<DestinationResponse | null> {
    return this._destinations.asObservable();
  }

  check(){
    return this._destinations.getValue();
  }
  /**
   * Get all destinations with pagination, filtering, and sorting
   * Updates the global state with the fetched data
   */
  getAllDestinations(params?: any): Observable<DestinationResponse> {
    return this.http.post<any>(uriConfig.API_DESTINATION_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
      tap((response: DestinationResponse) => {
        this._destinations.next(response); // Update the global state
      })
    );
  }

  getDestinations(params?: any): Observable<DestinationResponse> {
    return this.http.post<any>(uriConfig.API_DESTINATION_ALL, params || {}).pipe(
      map(res => ({
        data: res.data?.data || [],
        total: res.data?.total,
        page: res.data?.page,
        page_size: res.data?.page_size
      })),
    );
  }

  /**
   * Create a new destination and update the global state
   */
  createDestination(destination: DestinationCreateRequest): Observable<any> {
    return this.http.post(uriConfig.API_DESTINATION_CREATE, destination).pipe(
      tap((newDestination: Destination) => {
        // Update the global state without calling API
        const currentState = this._destinations.getValue();
        if (currentState) {
          const updatedData = [...currentState.data, newDestination];
          this._destinations.next({
            ...currentState,
            data: updatedData,
            total: currentState.total + 1
          });
        }
      })
    );
  }

  /**
   * Update an existing destination and update the global state
   */
  updateDestination(uuid: string, destination: DestinationUpdateRequest): Observable<any> {
    return this.http.patch(uriConfig.API_DESTINATION_UPDATE(uuid), destination).pipe(
      tap((updatedDestination: Destination) => {
        // Update the global state without calling API
        const currentState = this._destinations.getValue();
        if (currentState) {
          const updatedData = currentState.data.map(item =>
            item.uuid === uuid ? { ...item, ...updatedDestination } : item
          );
          this._destinations.next({
            ...currentState,
            data: updatedData
          });
        }
      })
    );
  }

  /**
   * Delete a destination and update the global state
   */
  deleteDestination(uuid: string): Observable<any> {
    return this.http.delete(uriConfig.API_DESTINATION_DELETE(uuid)).pipe(
      tap(() => {
        // Update the global state without calling API
        const currentState = this._destinations.getValue();
        if (currentState) {
          const updatedData = currentState.data.filter(item => item.uuid !== uuid);
          this._destinations.next({
            ...currentState,
            data: updatedData,
            total: currentState.total - 1
          });
        }
      })
    );
  }

  detailDestination(uuid: string): Observable<any>{
    return this.http.get(uriConfig.API_DESTINATION_DETAIL(uuid)).pipe(
      map((res:any)=>({
        data: res.data?.data
      })),
      tap(res =>{
        console.log("detail res: ", res)
      })
    )
  }
}