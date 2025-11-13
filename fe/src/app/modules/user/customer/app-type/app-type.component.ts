import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppTypeService } from 'app/core/admin/app-type/app-type.service';
import { AppType } from 'app/core/admin/app-type/app-type.types';
import { NewsService } from 'app/core/admin/news/news.service';

@Component({
    selector: 'app-app-type',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CustomPaginationComponent,
        RouterModule,
        
    ],
    templateUrl: './app-type.component.html',
    styles: ``
})
export class AppTypeComponent implements OnInit {
    constructor(
        private _appTypeService: AppTypeService,
        public translocoService: TranslocoService,
        private _alertService: AlertService,
        private _newsService: NewsService,
    ) {}


    appTypes: AppType[] = [];
    newApp: Partial<AppType> = {
        logo: '',
        title: '',
        appType: 1,
        secretKey: ''
    };
    selectedAppId: number | null = null;


    ngOnInit(): void {
        this.loadApp();
    }

    loadApp(): void {
        this._appTypeService.getAppTypes().subscribe((appTypes) => {
            this.appTypes = appTypes;
            console.log(this.appTypes)
        });
    }
}   