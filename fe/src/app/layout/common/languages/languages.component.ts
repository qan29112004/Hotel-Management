import { CommonModule, NgFor, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';
import { LanguageService } from 'app/core/language/language.service';
import { AppTitleService } from 'app/core/title/title.service';
import { take } from 'rxjs';

@Component({
    selector: 'languages',
    templateUrl: './languages.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'languages',
    standalone: true,
    imports: [
        MatButtonModule,
        MatMenuModule,
        NgTemplateOutlet,
        NgFor,
        MatIconModule,
        CommonModule,
    ],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    availableLangs: AvailableLangs;
    activeLang: string;
    flagCodes: any;
    TextCodes: any;
    @Input() isAuth: boolean;

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseNavigationService: FuseNavigationService,
        private _translocoService: TranslocoService,
        private _languageService: LanguageService,
        private _appTitleService: AppTitleService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.availableLangs = this._translocoService.getAvailableLangs();

        // Khởi tạo lang từ localStorage
        this._languageService.initLang(this.availableLangs);

        // Lắng nghe thay đổi lang
        this._translocoService.langChanges$.subscribe((activeLang) => {
            this.activeLang = activeLang;
            this._updateNavigation(activeLang);
        });

        this.flagCodes = {
            vn: 'vn',
            en: 'us',
        };

        this.TextCodes = {
            vn: 'Tiếng Việt',
            en: 'English',
        };
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the active lang
     *
     * @param lang
     */
    setActiveLang(lang: string): void {
        // Set the active lang
        this._languageService.setActiveLang(lang);
        // Gọi cập nhật lại title sau khi đổi ngôn ngữ
        this._appTitleService.updateTitleManually();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the navigation
     *
     * @param lang
     * @private
     */
    private _updateNavigation(lang: string): void {
        // Get the component -> navigation data -> item
        const navComponent =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                'mainNavigation'
            );

        // Return if the navigation component does not exist
        if (!navComponent) {
            return null;
        }
        const navItemsToTranslate = [
            { id: 'home-page', key: 'menu.home-page' },
            { id: 'news-feed', key: 'menu.news-feed' },
            { id: 'list-app', key: 'menu.list-app' },
            { id: 'admin.app-type', key: 'menu.admin.app_type' },
            { id: 'admin.management_user', key: 'menu.admin.management_user' },
            { id: 'admin.personal', key: 'menu.admin.form' },
            { id: 'admin.personal.customer', key: 'menu.admin.individual_customer' },
            { id: 'admin.news_management', key: 'menu.admin.news_management' },
            { id: 'admin.news-category', key: 'menu.admin.news_category' },
            { id: 'admin.news', key: 'menu.admin.news' },
            { id: 'mod.app-type', key: 'menu.mod.app_type' },
            { id: 'mod.news', key: 'menu.mod.news' },
            { id: 'user.customer', key: 'menu.user.individual_customer' },
            { id: 'user.app-type', key: 'menu.user.app_type' },
            { id: 'user.news', key: 'menu.user.news' },
            { id: 'content.content', key: 'menu.content.content' },
            { id: 'admin.feedback', key: 'menu.admin.feedback' },
            { id: 'feedback', key: 'menu.feedback' },
            { id: 'admin.market', key: 'menu.admin.marketManagement.home' },
            { id: 'admin.management', key: 'menu.admin.management' },
            {
                id: 'admin.market.category',
                key: 'menu.admin.marketManagement.categoryManagement',
            },
            {
                id: 'admin.market.product',
                key: 'menu.admin.marketManagement.productManagement',
            },
            { id:'chat', key:'menu.chat'},
            { id:'marketplace', key:'menu.marketplace'},
            { id:'admin.destination', key: 'menu.admin.destination'},
            { id:'destination', key: 'menu.admin.destination'},
            { id:'admin.amenity', key: 'menu.admin.amenity'},
            { id:'admin.hotel', key: 'menu.admin.hotel'},
            { id:'admin.room_type', key: 'menu.admin.room_type'},
            { id:'admin.room', key: 'menu.admin.room'}
        ];

        navItemsToTranslate.forEach(({ id, key }) =>
            this._translateAndSetNavigationTitle(navComponent, id, key)
        );
    }

    private _translateAndSetNavigationTitle(
        navComponent: FuseVerticalNavigationComponent,
        itemId: string,
        translateKey: string
    ): void {
        const item = this._fuseNavigationService.getItem(
            itemId,
            navComponent.navigation
        );
        if (item) {
            this._translocoService
                .selectTranslate(translateKey)
                .pipe(take(1))
                .subscribe((translatedTitle) => {
                    item.title = translatedTitle;
                    navComponent.refresh();
                });
        }
    }
}
