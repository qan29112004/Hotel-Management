import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, take } from 'rxjs';

@Injectable({providedIn: 'root'})
export class FuseSplashScreenService
{
    /**
     * Constructor
     */
    constructor(
        @Inject(DOCUMENT) private _document: any,
        private _router: Router,
    )
    {
        // Hide it on the first NavigationEnd event
        this._router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                take(1),
            )
            .subscribe(() => {
             setTimeout(() => {
            this.hide();
        }, 5000); // 2000 ms = 2 giây
    });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Show the splash screen
     */
    show(): void
    {
        this._document.body.classList.remove('fuse-splash-screen-hidden');
    }

    /**
     * Hide the splash screen
     */
    hide(): void
    {
        this._document.body.classList.add('fuse-splash-screen-hidden');
    }
}
