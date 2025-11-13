import { Component, OnInit } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { AppTitleService } from './core/title/title.service';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

@Component({
    selector: 'app-root',

    templateUrl: './app.component.html',

    standalone: true,
    styleUrls: ['./app.component.scss'],

    imports: [RouterOutlet],
})
export class AppComponent {
    constructor(private _appTitleService: AppTitleService) {
        this._appTitleService.init();
    }
}
