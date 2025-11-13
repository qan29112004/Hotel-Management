import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { uriConfig } from 'app/core/uri/config';

@Injectable({
  providedIn: 'root'
})
export class ChatAudioService {

  constructor() { }
  private _httpClient = inject(HttpClient);

  uploadAudio(formData: FormData): Observable<{
  code: string;
  message: string;
  data: { text: string };
}> {
  return this._httpClient.post<{
      code: string;
      message: string;
      data: { text: string };
  }>(uriConfig.API_UPLOAD_AUDIO, formData);
}
}
