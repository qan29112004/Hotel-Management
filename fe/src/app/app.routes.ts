import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { routeConfig } from './core/uri/config.route';
import { AdminGuard } from './core/auth/guards/admin.guard';
import { destinationResolver } from './shared/utils/resolve/destination.resolve';
import { hotelResolver } from './shared/utils/resolve/all_hotel.resolve';
import { destinationDetailResolver } from './shared/utils/resolve/destination_detail.resolve';
import { exploreHotelsResolver } from './shared/utils/resolve/explore_hotel.resolve';
import { QueryParamGuard } from './core/auth/guards/query_param.guard';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    { path: '', pathMatch: 'full', redirectTo: routeConfig.ROUTER_REDIRECT_TO },
    {
        path: 'signed-in-redirect',
        pathMatch: 'full',
        redirectTo: routeConfig.ROUTER_REDIRECT_TO,
    },

    {
        path: routeConfig.AUTH_NEWS,
        data: { title: 'news.title' },
        loadChildren: () => import('app/modules/auth/news/news.routes'),
    },
    {
        path: routeConfig.AUTH_NEWS_DETAIL,
        data: { title: 'news_detail.title' },
        loadChildren: () =>
            import('app/modules/auth/news-detail/news-detail.routes'),
    },
    

    // Auth routes for guests
    
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],

        children: [
            {
                path: routeConfig.AUTH_FORGOT_PASS,
                data: { title: 'forgot_password.title' },
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.routes'
                    ),
            },
            {
                path: routeConfig.AUTH_CONFIN_EMAIL,
                data: { title: 'forgot_password.title' },
                loadChildren: () =>
                    import(
                        'app/modules/auth/confirmation-email/confirmation-email.routes'
                    ),
            },
            {
                path: routeConfig.AUTH_SIGN_IN,
                data: { title: 'sign_in.title' },
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.routes'),
            },
            {
                path: routeConfig.AUTH_CREATE_ACC,
                data: { title: 'create_account.title' },
                loadChildren: () =>
                    import('app/modules/auth/create-account/create-account.routes'),
            },
            {
                path: routeConfig.AUTH_SIGN_IN_OTP,
                data: { title: 'sign_in_otp.title' },
                loadChildren: () =>
                    import('app/modules/auth/sign-in-otp/sign-in-otp.routes'),
            },
            {
                path: routeConfig.AUTH_OTP_VER,
                data: { title: 'otp_verification.title' },
                loadChildren: () =>
                    import(
                        'app/modules/auth/otp-verification/otp-verification.routes'
                    ),
            },
            
        ],
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: routeConfig.AUTH_USER_INFOR,
                data: { title: 'user_infor.title' },
                loadChildren: () =>
                    import(
                        'app/modules/user/customer/user-infor/user-infor-edit/user-infor-edit.route'
                    ),
            },
            
            {
                path: routeConfig.NEWS_FEED,
                data: { title: 'news-feed.title' },
                loadChildren: () =>
                    import('app/modules/auth/news-feed/news-feed.routes'),
            },
            {
                path: routeConfig.LIST_APP,
                data: { title: 'list-app.title' },
                loadChildren: () =>
                    import('app/modules/auth/list-app/list-app.routes'),
            },
            {
                path: routeConfig.MARKETPLACE,
                data: { title: 'marketplace.title' },
                loadChildren: () => import('app/modules/auth/marketplace/marketplace.routes'),
                
            },
            {
                path: routeConfig.USER_FEEDBACK,
                data: {title: 'FeedBack'},
                loadChildren: () => import('app/modules/auth/feedback/feedback.routers'),
            },
            {
                path: routeConfig.MY_BOOKING,
                data: {title: 'My Booking'},
                loadChildren: () => import('app/modules/auth/my-booking/my-booking.route'),
            },
            {
                path: routeConfig.MY_VOUCHER,
                data: { title: 'voucher.title' },
                loadChildren: () =>
                    import(
                        'app/modules/landing/voucher/voucher.route'
                    ),
            },
        ],
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'auth',
        },
        children: [
            // {
            //     path: 'home',
            //     loadChildren: () =>
            //         import('app/modules/landing/home/home.routes'),
            // },
            {
                path: routeConfig.AUTH_CHANGE_PASS,
                data: { title: 'change_password.title' },
                loadChildren: () =>
                    import(
                        'app/modules/auth/change-password/change-password.routes'
                    ),
            },
            {
                path: routeConfig.AUTH_CREATE_ACC,
                data: { title: 'create_account.title' },
                loadChildren: () =>
                    import(
                        'app/modules/auth/create-account/create-account.routes'
                    ),
            },
        ],
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard, AdminGuard],
        canActivateChild: [AuthGuard, AdminGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: routeConfig.ROUTER_ADMIN,
                children: [
                    {
                        path: routeConfig.APP_TYPE,
                        data: { title: 'app_type.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/app-type/app-type.routes'
                            ),
                    },
                    {
                        path: routeConfig.USER_MANAGEMENT,
                        data: { title: 'user_management.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/user-management/user-management.route'
                            ),
                    },
                    {
                        path: routeConfig.PERSONAL_CUSTOMER,
                        data: { title: 'personal_customer.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/personal-customer/personal-customer.route'
                            ),
                    },
                    {
                        path: routeConfig.EDIT_FORM_TEMPLATE,
                        data: { title: 'edit_form.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/personal-customer/edit-form-template/edit-form-template.route'
                            ),
                    },
                    {
                        path: routeConfig.NEWS,
                        data: { title: 'news.title' },
                        loadChildren: () =>
                            import('app/modules/admin/news/news.routes'),
                    },
                    {
                        path: routeConfig.ADD_NEWS,
                        data: { title: 'news.add_news' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/add-news/add-news.routes'
                            ),
                    },
                    {
                        path: routeConfig.EDIT_NEWS,
                        data: { title: 'news.edit_news' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/edit-news/edit-news.routes'
                            ),
                    },
                    {
                        path: routeConfig.NEWS_DETAIL,
                        data: { title: 'news_detail.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/news-detail/news-detail.routes'
                            ),
                    },
                    {
                        path: routeConfig.CONTENT,
                        data: { title: 'Training Content' },
                        loadChildren: () =>
                            import('app/modules/admin/content/content.routes'),
                    },
                    {
                        path: routeConfig.DESTINATION,
                        data: { title: 'destination.title' },
                        loadChildren: () =>
                            import('app/modules/admin/desination/destination.routes'),
                    },
                    {
                        path: routeConfig.HOTEL,
                        data: { title: 'hotel.title' },
                        loadChildren: () =>
                            import('app/modules/admin/hotel/hotel.routes'),
                    },
                    {
                        path: routeConfig.ROOM_TYPE,
                        data: { title: 'room_type.title' },
                        loadChildren: () =>
                            import('app/modules/admin/roomtype/roomtype.routes'),
                    },
                    {
                        path: routeConfig.ROOM,
                        data: { title: 'room.title' },
                        loadChildren: () =>
                            import('app/modules/admin/room/room.routes'),
                    },
                    {
                        path: routeConfig.AMENITY,
                        data: { title: 'amenity.title' },
                        loadChildren: () =>
                            import('app/modules/admin/amenity/amenity.routes'),
                    },
                    {
                        path: routeConfig.OFFER,
                        data: { title: 'offer.title' },
                        loadChildren: () =>
                            import('app/modules/admin/offer/offer.routes'),
                    },
                    {
                        path: routeConfig.BOOKING,
                        data: { title: 'booking.title' },
                        loadChildren: () =>
                            import('app/modules/admin/booking/booking.route'),
                    },{
                        path: routeConfig.SERVICE,
                        data: { title: 'service.title' },
                        loadChildren: () =>
                            import('app/modules/admin/service/service.route'),
                    },
                    {
                        path: routeConfig.RATEPLAN,
                        data: { title: 'rateplan.title' },
                        loadChildren: () =>
                            import('app/modules/admin/rateplan/rateplan.route'),
                    },
                    {
                        path: routeConfig.RATING,
                        data: { title: 'rating.title' },
                        loadChildren: () =>
                            import('app/modules/admin/rating/rating.route'),
                    },
                    {
                        path: routeConfig.ADMIN_FEEDBACK,
                        data: { title: 'FeedBack' },
                        loadChildren: () =>
                            import('app/modules/admin/feedback/feedback.routers'),
                    },

                    {
                        path: routeConfig.NEWS_CATEGORY,
                        data: { title: 'news_category.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/news-category/news-category.routes'
                            ),
                    },
                    {
                        path: routeConfig.VOUCHER,
                        data: { title: 'voucher.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/admin/voucher/voucher.route'
                            ),
                    },
                    
                    {
                        path: routeConfig.MARKET_MANAGEMENT,
                        children: [
                            {
                                path: routeConfig.CATEGORY_MANAGEMENT,
                                data: { title: '' },
                                loadChildren: () =>
                                    import(
                                        'app/modules/admin/market/product-category/product-category.routes'
                                    ),
                            },
                            {
                                path: routeConfig.PRODUCT_MANAGEMENT,
                                data: { title: '' },
                                loadChildren: () =>
                                    import(
                                        'app/modules/admin/market/product-management/product-management.routes'
                                    ),
                            },
                        ],
                        
                    },
                    
                ],
            },
            {
                path: 'example',
                loadChildren: () =>
                    import('app/modules/admin/example/example.routes'),
            },

            // 404 & Catch all
            // {path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/modules/admin/error/error-404/error-404.routes')},
            // {path: '**', redirectTo: '404-not-found'}
        ],
    },

    // Mod routes
    {
        path: '',
        canActivate: [AuthGuard, AdminGuard],
        canActivateChild: [AuthGuard, AdminGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: routeConfig.ROUTER_RECEPT,
                children: [
                    {
                        path: routeConfig.CHAT,
                        data: { title: 'chat.title' },
                        loadChildren: () =>
                            import('app/modules/auth/chat/chat.routes'),
                    }
                ],
            },

            // 404 & Catch all
            // {path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/modules/admin/error/error-404/error-404.routes')},
            // {path: '**', redirectTo: '404-not-found'}
        ],
    },

    // User routes
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: routeConfig.DESTINATION,
                data: { title: 'destination.title' },
                resolve: {
                    destination: destinationResolver,
                    hotel: hotelResolver
                },
                loadChildren: () =>
                    import(
                        'app/modules/landing/destination/destination.routes'
                    ),
            },
            {
                path: routeConfig.HOME_PAGE,
                data: { title: 'home-page.title' },
                loadChildren: () =>
                    import('app/modules/auth/home-page/home-page.routes'),
            },
            {
                path: 'booking',
                canActivate: [QueryParamGuard] ,
                data: { title: 'home-page.title' },
                loadChildren: () =>
                    import('app/modules/landing/booking/booking.routes'),
            },
            {
                path: routeConfig.EXPLORE_HOTEL,
                resolve: {
                    hotel: exploreHotelsResolver
                },
                data: { title: 'home-page.title' },
                loadChildren: () =>
                    import('app/modules/landing/explore-hotel/explore-hotel.routes'),
            },
            {
                path: routeConfig.HOTEL + '/:slug',
                data: { title: 'home-page.title' },
                loadChildren: () =>
                    import('app/modules/landing/hotel-particular/hotel-particular.routes'),
            },
            {
                path: 'booking/success',
                data: { title: 'home-page.title' },
                loadChildren: () =>
                    import('app/modules/landing/success-booking/success-booking.routes'),
            },
            {
                path: ':slug',
                data: { title: 'destination.title' },
                resolve:{
                    destination: destinationDetailResolver
                },
                loadChildren: () =>
                    import('app/modules/landing/des-paticular/des-paticular.routes'),
            },
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver,
        },
        children: [
            {
                path: routeConfig.ROUTER_USER,
                children: [
                    {
                        path: routeConfig.CUSTOMER_LIST,
                        data: { title: 'customer.title' },
                        loadChildren: () =>
                            import('app/modules/user/customer/customer.route'),
                    },
                    {
                        path: routeConfig.CUSTOMER_DETAIL,
                        data: { title: 'detail_customer.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/detail-customer/detail-customer.route'
                            ),
                    },
                    {
                        path: routeConfig.APP_TYPE,
                        data: { title: 'app_type.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/app-type/app-type.routes'
                            ),
                    },
                    {
                        path: routeConfig.NEWS,
                        data: { title: 'news.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/news/news.routes'
                            ),
                    },
                    {
                        path: routeConfig.ADD_NEWS,
                        data: { title: 'news.add_news' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/add-news/add-news.routes'
                            ),
                    },
                    {
                        path: routeConfig.EDIT_NEWS,
                        data: { title: 'news.edit_news' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/edit-news/edit-news.routes'
                            ),
                    },
                    {
                        path: routeConfig.NEWS_DETAIL,
                        data: { title: 'news_detail.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/news-detail/news-detail.routes'
                            ),
                    },
                    
                ],
            },
            {
                path: routeConfig.ROUTER_USER,
                children: [
                    {
                        path: routeConfig.CUSTOMER_ADD,
                        data: { title: 'add_customer.title' },
                        loadChildren: () =>
                            import(
                                'app/modules/user/customer/add-customer/add-customer.route'
                            ),
                    },
                ],
            },
            // {
            //     path: routeConfig.ROUTER_USER, children: [
            //         {
            //             path: routeConfig.CUSTOMER_EDIT,
            //             data: { title: 'edit_customer.title' },
            //             loadChildren: () =>
            //                 import(
            //                     'app/modules/user/customer/edit-customer/edit-customer.route'
            //                 ),
            //         },
            //     ]
            // },

            // 404 & Catch all
            {
                path: routeConfig.ROUTER_NOT_FOUND,
                pathMatch: 'full',
                loadChildren: () =>
                    import(
                        'app/modules/admin/error/error-404/error-404.routes'
                    ),
            },
            { path: '**', redirectTo: routeConfig.ROUTER_NOT_FOUND },
        ],
    },
    
];
