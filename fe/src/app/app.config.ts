import { provideHttpClient } from '@angular/common/http';
import {
    APP_INITIALIZER,
    ApplicationConfig,
    inject,
    importProvidersFrom,
    LOCALE_ID 
} from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
    PreloadAllModules,
    provideRouter,
    withInMemoryScrolling,
    withPreloading,
} from '@angular/router';
import { provideFuse } from '@fuse';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { LANG_STORAGE_KEY } from './core/language/language.constants';
import { LIGHT_KEY, SCHEME_STORAGE_KEY } from './core/scheme/scheme.constants';
import { mockApiServices } from 'app/mock-api';
import { DatePipe } from '@angular/common';
import { withInterceptors } from '@angular/common/http';
import { authInterceptor } from 'app/core/auth/auth.interceptor'; // đường dẫn interceptor của bạn
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { firebaseConfig } from './core/chat/config/firebase.config';
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';
registerLocaleData(localeVi);
const storedLang =
    typeof window !== 'undefined'
        ? localStorage.getItem(LANG_STORAGE_KEY)
        : null;
const defaultLang = storedLang || 'vn';

const storedScheme =
    typeof window !== 'undefined'
        ? localStorage.getItem(SCHEME_STORAGE_KEY)
        : null;
const defaultScheme = storedScheme || LIGHT_KEY;
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes),

        // 👇 Đặt ngôn ngữ mặc định cho toàn bộ app
        { provide: LOCALE_ID, useValue: 'vi' },

        // 👇 (Tuỳ chọn) Nếu bạn muốn gửi Accept-Language qua HTTP request
        provideHttpClient(withInterceptors([
        (req, next) => {
            const clone = req.clone({
            setHeaders: { 'Accept-Language': 'vi' },
            });
            return next(clone);
        }
        ])),
        importProvidersFrom(
            provideFirebaseApp(() => initializeApp(firebaseConfig)),
            provideFirestore(() => getFirestore()),
            provideStorage(() => getStorage())
        ),
        provideAnimations(),
        provideHttpClient(withInterceptors([authInterceptor])),
        DatePipe,
        provideRouter(
            appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),

        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs: [
                    {
                        id: 'vn',
                        label: 'Tiếng Việt',
                    },
                    {
                        id: 'en',
                        label: 'English',
                    },
                ],
                defaultLang: defaultLang,
                fallbackLang: defaultLang,
                reRenderOnLangChange: true,
                prodMode: true,
            },
            loader: TranslocoHttpLoader,
        }),
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide: APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);

                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi: true,
        },

        // Fuse
        provideAuth(),
        provideIcons(),
        provideMarkdown(),
        provideFuse({
            mockApi: {
                delay: 0,
                services: mockApiServices,
            },
            fuse: {
                layout: 'dense',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
