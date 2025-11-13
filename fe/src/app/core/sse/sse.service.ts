import { Injectable , NgZone } from '@angular/core';
import { uriConfig } from '../uri/config';
import {
    catchError,
    map,
    Observable,
    of,
    ReplaySubject,
    Subject,
    BehaviorSubject,
    switchMap,
    tap,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SseService {
  private eventSource?: EventSource;
  private currentSessionId: string | null = null;
  private checkInterval?: any;
  constructor(private http:HttpClient, private zone: NgZone) { }

  startWatching(callback: (data: any) => void) {
    // Check mỗi 3 giây xem localStorage có session_id không
    this.checkInterval = setInterval(() => {
      const sessionId = localStorage.getItem('session_id');

      // Nếu có session_id mà chưa connect
      if (sessionId && sessionId !== this.currentSessionId) {
        this.currentSessionId = sessionId;
        console.log('[SSE] Found new session, connecting...');
        this.connect(sessionId, callback);
      }

      // Nếu không có session_id mà đang connect
      if (!sessionId && this.eventSource) {
        console.log('[SSE] Session removed, closing connection...');
        this.close();
      }
    }, 3000);

    // Ngoài ra: lắng nghe thay đổi localStorage từ các tab khác
    window.addEventListener('storage', (event) => {
      if (event.key === 'session_id') {
        if (event.newValue) {
          this.connect(event.newValue, callback);
        } else {
          this.close();
        }
      }
    });
  }


  connect(sessionId: string, callback: (data: any) => void) {
    this.close()
    this.eventSource = new EventSource(uriConfig.API_SSE(sessionId));

    this.eventSource.onmessage = (event) => {
      this.zone.run(() => {
        const data = JSON.parse(event.data);
        callback(data);
      });
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.eventSource?.close();
    };
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
      this.currentSessionId = null;
    }
  }

}
