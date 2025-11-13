// multi-select.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MultiSelectService {
    private closeAllDropdownsSubject = new Subject<string>();
    closeAllDropdowns$ = this.closeAllDropdownsSubject.asObservable();

    emitCloseAll(exceptId: string) {
        this.closeAllDropdownsSubject.next(exceptId);
    }
}
