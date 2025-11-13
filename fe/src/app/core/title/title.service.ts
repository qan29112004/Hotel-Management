import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { TITLE_WEB_KEY } from './title.constants';

@Injectable({
    providedIn: 'root'
})
export class AppTitleService {
    constructor(
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _title: Title,
        private _translocoService: TranslocoService
    ) {
        this._translocoService.langChanges$.subscribe(() => {
            this.updateTitle();
        })
    }
    updateTitle(): void {
        const route = this.getDeepestRoute(this._activatedRoute);
        const titleKey = route.snapshot.data?.['title'];

        if (titleKey) {
            // Dùng selectTranslate để đợi Transloco load xong
            this._translocoService
                .selectTranslate(titleKey)
                .pipe(take(1))
                .subscribe((translatedTitle) => {
                    this._title.setTitle(`${translatedTitle} | ${TITLE_WEB_KEY}`);
                });
        }
    }

    init(): void {
        this._router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            map(() => {
                let route = this._activatedRoute.firstChild;
                while (route?.firstChild) {
                    route = route.firstChild;
                }
                return route;
            }),
            mergeMap(route => route?.data ?? []),
        ).subscribe(data => {
            const titleKey = data['title'];
            if (titleKey) {
                const translatedTitle = this._translocoService.translate(titleKey);
                this._title.setTitle(`${translatedTitle} | ${TITLE_WEB_KEY}`);
            }
        });

        // Update title on language change
        this._translocoService.langChanges$.subscribe(() => {
            const route = this.getDeepestRoute(this._activatedRoute);
            const titleKey = route?.snapshot?.data?.['title'];
            if (titleKey) {
                const translatedTitle = this._translocoService.translate(titleKey);
                this._title.setTitle(`${translatedTitle} | ${TITLE_WEB_KEY}`);
            }
        });
    }

    private getDeepestRoute(route: ActivatedRoute): ActivatedRoute {
        while (route.firstChild) {
            route = route.firstChild;
        }
        return route;
    }
    updateTitleManually(): void {
        const route = this.getDeepestRoute(this._activatedRoute);
        const titleKey = route?.snapshot?.data?.['title'];
        if (titleKey) {
            const translatedTitle = this._translocoService.translate(titleKey);
            this._title.setTitle(`${translatedTitle} | ${TITLE_WEB_KEY}`);
        }
    }
    
}
