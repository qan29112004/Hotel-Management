import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { uriConfig } from '../uri/config';

@Injectable({
  providedIn: 'root'
})
export class SseService implements OnDestroy {
  private eventSource?: EventSource;
  private currentSessionId: string | null = null;
  private checkInterval?: any;
  private storageListener?: (event: StorageEvent) => void;
  private isConnecting: boolean = false; // ✅ Thêm flag để tránh connect song song

  constructor(private zone: NgZone) { }

  startWatching(callback: (data: any) => void) {
    // ✅ Chỉ setup listener 1 lần
    if (this.checkInterval || this.storageListener) {
      console.warn('[SSE] Already watching');
      return;
    }

    // Check mỗi 3 giây
    this.checkInterval = setInterval(() => {
      const sessionId = localStorage.getItem('session_id');

      if (sessionId && sessionId !== this.currentSessionId && !this.isConnecting) {
        this.currentSessionId = sessionId;
        console.log('[SSE] Found new session, connecting...');
        this.connect(sessionId, callback);
      }

      if (!sessionId && this.eventSource) {
        console.log('[SSE] Session removed, closing connection...');
        this.close();
      }
    }, 3000);

    // ✅ Lưu reference để có thể removeEventListener sau này
    this.storageListener = (event: StorageEvent) => {
      if (event.key === 'session_id') {
        const newSessionId = event.newValue;
        
        // ✅ Chỉ connect nếu session_id thực sự thay đổi
        if (newSessionId && newSessionId !== this.currentSessionId && !this.isConnecting) {
          console.log('[SSE] Storage changed, connecting to new session...');
          this.connect(newSessionId, callback);
        } else if (!newSessionId) {
          console.log('[SSE] Storage cleared, closing connection...');
          this.close();
        }
      }
    };

    window.addEventListener('storage', this.storageListener);

    // ✅ Connect ngay nếu đã có session_id
    const initialSessionId = localStorage.getItem('session_id');
    if (initialSessionId) {
      this.connect(initialSessionId, callback);
    }
  }

  connect(sessionId: string, callback: (data: any) => void) {
    // ✅ Tránh connect song song
    if (this.isConnecting) {
      console.log('[SSE] Already connecting, skipping...');
      return;
    }

    // ✅ Tránh connect lại cùng session
    if (this.currentSessionId === sessionId && this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('[SSE] Already connected to this session');
      return;
    }

    console.log(`[SSE] Connecting to session: ${sessionId}`);
    
    // ✅ Set currentSessionId TRƯỚC khi close để tránh race condition
    this.currentSessionId = sessionId;
    this.isConnecting = true;
    
    // Đóng connection cũ nếu có
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    
    this.eventSource = new EventSource(uriConfig.API_SSE(sessionId));

    this.eventSource.onopen = (e) => {
      console.log('[SSE] Connection established', e);
      this.isConnecting = false;
    };

    this.eventSource.onmessage = (event) => {
      console.log('[SSE] Raw message received:', event.data);
      this.zone.run(() => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Parsed data:', data);
          callback(data);
        } catch (error) {
          console.error('[SSE] Failed to parse message:', error, 'Raw:', event.data);
        }
      });
    };

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error, 'ReadyState:', this.eventSource?.readyState);
      this.isConnecting = false;
      
      // ✅ Đóng và reset state
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = undefined;
      }

      // ✅ Tự động reconnect sau 5 giây (nếu vẫn có session_id)
      setTimeout(() => {
        const currentStoredSessionId = localStorage.getItem('session_id');
        if (currentStoredSessionId === this.currentSessionId && currentStoredSessionId) {
          console.log('[SSE] Attempting to reconnect...');
          this.connect(currentStoredSessionId, callback);
        } else {
          console.log('[SSE] Session changed, not reconnecting');
        }
      }, 5000);
    };
  }

  close() {
    if (this.eventSource) {
      console.log('[SSE] Closing connection');
      this.eventSource.close();
      this.eventSource = undefined;
      this.currentSessionId = null;
      this.isConnecting = false;
    }
  }

  stopWatching() {
    // ✅ Cleanup interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    // ✅ Cleanup storage listener
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = undefined;
    }

    this.close();
  }

  ngOnDestroy() {
    this.stopWatching();
  }
}