import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthLayoutService {
    public image$ = new BehaviorSubject<string>('');
    public title$ = new BehaviorSubject<string>('');
    public titleDes$ = new BehaviorSubject<string>('');

    setImage(image: string) {
        this.image$.next(image);
    }

    setTitle(title: string) {
        this.title$.next(title);
    }
    setTitleDes(title: string) {
        this.titleDes$.next(title);
    }

    // Responsive sidebar và thẻ phân hạng
    sidebarToggled$ = new Subject<void>();

    notifySidebarToggled() {
        this.sidebarToggled$.next();
    }
}
