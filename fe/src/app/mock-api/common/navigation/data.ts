/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';
import { routeConfig } from 'app/core/uri/config.route';
import { UserService } from 'app/core/profile/user/user.service';
import { takeUntil, combineLatest } from 'rxjs';

export const defaultNavigation: FuseNavigationItem[] = [
    // {
    //     id: 'dashboards',
    //     title: 'Dashboards',
    //     subtitle: 'Unique dashboard designs',
    //     type: 'group',
    //     // icon    : 'heroicons_outline:home',
    //     children: [
    //         {
    //             id: 'dashboards.project',
    //             title: 'Project',
    //             type: 'basic',
    //             icon: 'heroicons_outline:clipboard-document-check',
    //             link: '/dashboards/project',
    //         },
    //         {
    //             id: 'dashboards.analytics',
    //             title: 'Analytics',
    //             type: 'basic',
    //             icon: 'heroicons_outline:chart-pie',
    //             link: '/dashboards/analytics',
    //         },
    //     ],
    // },
    {
        id: 'home-page',
        title: 'Home',
        type: 'basic',
        icon: 'assets/images/ui/menu/home.svg',
        link: routeConfig.HOME_PAGE,
    },
    // {
    //     id: 'news-feed',
    //     title: 'News feed',
    //     type: 'basic',
    //     icon: 'heroicons_outline:document-text',
    //     link: routeConfig.NEWS_FEED
    // },
    {
        id: 'list-app',
        title: 'List app',
        type: 'basic',
        icon: 'heroicons_outline:clipboard',
        link: routeConfig.LIST_APP
    },
    // {
    //     id: 'marketplace',
    //     title:'Marketplace',
    //     type: 'basic',
    //     icon: 'heroicons_outline:building-storefront',
    //     link: routeConfig.MARKETPLACE
    // },
    {
        id: 'chat',
        title:'Messenger',
        type: 'basic',
        icon: 'assets/images/ui/menu/chat.svg',
        link: routeConfig.CHAT
    },
    {
        id: 'feedback',
        title: 'FeedBack',
        type: 'basic',
        icon: 'heroicons_outline:megaphone',
        link: routeConfig.USER_FEEDBACK
    },
    {
        id: routeConfig.ROUTER_ADMIN,
        // title: 'Admin',
        // subtitle: 'Unique admin designs',
        type: 'group',
        // icon    : 'heroicons_outline:home',
        children: [
            {
                id: 'admin.dashboard',
                title: 'Dashboard',
                type: 'basic',
                icon: 'assets/images/ui/menu/dashboard.svg',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.DASH_BOARD}`,
            },
            // {
            //     id: 'admin.management-user',
            //     title: 'Management User',
            //     type: 'basic',
            //     icon: 'assets/images/ui/menu/people.svg',
            //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.USER_MANAGEMENT}`,
            // },
            // {
            //     id: 'admin.app-type',
            //     title: 'App Type',
            //     type: 'basic',
            //     icon: 'assets/images/ui/menu/app.svg',
            //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.APP_TYPE}`,
            // },
            // {
            //     id: 'admin.personal',
            //     title: 'Biểu mẫu',
            //     type: 'collapsable',
            //     icon: 'heroicons_outline:document-text',
            //     children: [
            //         {
            //             id: 'admin.personal.customer',
            //             title: 'Khách hàng cá nhân',
            //             type: 'basic',
            //             link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`,
            //         },
            //         // {
            //         //     id: 'admin.personal-customer.2',
            //         //     title: 'Khách hàng doanh nghiệp',
            //         //     type: 'basic',
            //         //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`,
            //         // },
            //     ],
            // },

            {
                id: 'admin.management',
                title: 'Quản lý',
                type: 'collapsable',
                icon: 'assets/images/ui/menu/management.svg',
                children: [
                    {
                        id: 'admin.news-category',
                        title: 'Danh mục tin tức',
                        type: 'basic',
                        icon: 'heroicons_outline:tag',
                        link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.NEWS_CATEGORY}`,
                    },
                    {
                        id: 'admin.news',
                        title: 'Danh sách bản tin',
                        type: 'basic',
                        icon: 'heroicons_outline:newspaper',
                        link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.NEWS}`,
                    },
                    {
                        id: 'admin.management_user',
                        title: 'Quản lý người dùng',
                        type: 'basic',
                        icon: 'assets/images/ui/menu/people.svg',
                        link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.USER_MANAGEMENT}`,
                    },
                    {
                        id: 'admin.app-type',
                        title: 'Quản lý loại ứng dụng',
                        type: 'basic',
                        icon: 'assets/images/ui/menu/app.svg',
                        link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.APP_TYPE}`,
                    },
                    {
                        id: 'content.content',
                        title: 'Content',
                        type: 'basic',
                        icon: 'assets/images/ui/menu/content.svg',
                        link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.CONTENT}`,
                    },  
                    {
                        id: 'admin.settings',
                        title: 'Cài đặt Admin',
                        type: 'aside',
                        icon: 'heroicons_outline:cog',
                        children: [
                            {
                                id: 'settings.roles',
                                title: 'Quản lý vai trò',
                                type: 'basic',
                                link: `/${routeConfig.ROUTER_ADMIN}/roles`
                            },
                            {
                                id: 'settings.permissions',
                                title: 'Quản lý quyền',
                                type: 'basic',
                                link: `/${routeConfig.ROUTER_ADMIN}/permissions`
                            },
                            {
                                id: 'settings.system',
                                title: 'Cấu hình hệ thống',
                                type: 'basic',
                                link: `/${routeConfig.ROUTER_ADMIN}/system`
                            }
                        ]
                    }
                    // {
                    //     id: 'admin.market.category',
                    //     title: 'Category Management',
                    //     type: 'basic',
                    //     icon: 'heroicons_outline:tag',
                    //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.MARKET_MANAGEMENT}/${routeConfig.CATEGORY_MANAGEMENT}`,
                    // },
                    // {
                    //     id: 'admin.market.product',
                    //     title: 'Product Management',
                    //     type: 'basic',
                    //     icon: 'heroicons_outline:archive-box',
                    //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.MARKET_MANAGEMENT}/${routeConfig.PRODUCT_MANAGEMENT}`,
                    // },
                    // {
                    //     id: 'admin.feedback',
                    //     title: 'FeedBack',
                    //     type: 'basic',
                    //     icon: 'heroicons_outline:megaphone',
                    //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.ADMIN_FEEDBACK}`,
                    // },
                    // {
                    //     id: 'admin.personal-customer.2',
                    //     title: 'Khách hàng doanh nghiệp',
                    //     type: 'basic',
                    //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`,
                    // },
                ],
            },

            
            // {
            //     id: 'admin.news-category',
            //     title: 'News Category',
            //     type: 'basic',
            //     icon: 'heroicons_outline:tag',
            //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.NEWS_CATEGORY}`,
            // },
            // {
            //     id: 'admin.news',
            //     title: 'News',
            //     type: 'basic',
            //     icon: 'heroicons_outline:newspaper',
            //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.NEWS}`,
            // },
            
            
            
            
        ],
    },
    {

        
        id: routeConfig.ROUTER_MOD,
        // title: 'Mod',
        // subtitle: 'Unique mod designs',
        type: 'group',
        // icon    : 'heroicons_outline:home',
        children: [
            // {
            //     id: 'mod.news',
            //     title: 'Tin tức',
            //     type: 'basic',
            //     icon: 'heroicons_outline:newspaper',
            //     link: `/${routeConfig.ROUTER_MOD}/${routeConfig.NEWS}`,
            // },
        ],
    },
    {
        id: routeConfig.ROUTER_USER,
        // title: 'User',
        // subtitle: 'Unique user designs',
        type: 'group',
        // icon    : 'heroicons_outline:home',
        children: [
            // {
            //     id: 'user.customer',
            //     title: 'Khách hàng cá nhân',
            //     type: 'basic',
            //     icon: 'heroicons_outline:user',
            //     link: `/${routeConfig.ROUTER_USER}/${routeConfig.CUSTOMER_LIST}`,
            // },

            // {
            //     id: 'user.news',
            //     title: 'Tin tức',
            //     type: 'basic',
            //     icon: 'heroicons_outline:newspaper',
            //     link: `/${routeConfig.ROUTER_USER}/${routeConfig.MOD_NEWS}`,
            // },
        ],
    },
    
    
];
export const compactNavigation: FuseNavigationItem[] = [
    // Hiển thị trực tiếp các màn quản lý không ( mode compact )
    {
        id: 'home-page',
        title: 'Home',
        type: 'basic',
        icon: 'assets/images/ui/menu/home.svg',
        link: routeConfig.HOME_PAGE
    },
    {
        id: 'destination',
        title:'Destination',
        type: 'basic',
        icon: 'heroicons_outline:map',
        link: routeConfig.DESTINATION
    },
    {
        id: 'chat',
        title:'Messenger',
        type: 'basic',
        icon: 'assets/images/ui/menu/chat.svg',
        link: routeConfig.CHAT
    },
    {
        id: 'feedback',
        title: 'FeedBack',
        type: 'sticky',
        code:'user',
        icon: 'heroicons_outline:megaphone',
        function: () => {
          const event = new CustomEvent('open-feedback');
          window.dispatchEvent(event);
        }
    },
    {
        id: 'admin.management',
        title: 'Quản lý',
        type: 'aside',
        icon: 'assets/images/ui/menu/management.svg',
        code:'admin',
        children: [
            {
                id: 'admin.dashboard',
                title: 'Dashboard',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.DASH_BOARD}`,
            },
            
            {
                id: 'admin.management_user',
                title: 'Quản lý người dùng',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.USER_MANAGEMENT}`,
            },
            {
                id: 'content.content',
                title: 'Content',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.CONTENT}`,
            },
            {
                id: 'admin.feedback',
                title: 'FeedBack',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.ADMIN_FEEDBACK}`,
            },
            {
                id: 'admin.destination',
                title: 'Destination',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.DESTINATION}`,
            },
            {
                id: 'admin.hotel',
                title: 'Hotel',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.HOTEL}`,
            },
            {
                id: 'admin.room_type',
                title: 'Room type',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.ROOM_TYPE}`,
            },
            {
                id: 'admin.room',
                title: 'Room',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.ROOM}`,
            },
            {
                id: 'admin.amenity',
                title: 'Amenity',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.AMENITY}`,
            },
            {
                id: 'admin.offer',
                title: 'Offer',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.OFFER}`,
            },
            {
                id: 'admin.booking',
                title: 'Booking',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.BOOKING}`,
            },
            {
                id: 'admin.service',
                title: 'Service',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.SERVICE}`,
            },
            {
                id: 'admin.rateplan',
                title: 'Rate plan',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.RATEPLAN}`,
            },
            {
                id: 'admin.rating',
                title: 'Rating',
                type: 'basic',
                link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.RATING}`,
            }
        ]
    },
    
    // {
    //     id: 'admin.system_config',
    //     title: 'Cấu hình hệ thống',
    //     type: 'aside',
    //     icon: 'assets/images/ui/menu/config.svg',
    //     code:'admin',
    //     children: [
    //         // {
    //         //     id: 'admin.classification',
    //         //     title: 'Phân hạng người dùng',
    //         //     type: 'basic',
    //         //     link: `/${routeConfig.ROUTER_ADMIN}/${routeConfig.CLASSIFICATION}`,
    //         // }
    //     ]
    // },
    // {
    //     id: 'information',
    //     type: 'sticky',
    //     icon: 'assets/images/ui/menu/Infor.svg',
    //     tooltip:"Đang phát triển"
    // }

];
export const futuristicNavigation: FuseNavigationItem[] = [
    // {
    //     id: 'dashboards',
    //     title: 'DASHBOARDS',
    //     type: 'group',
    //     children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    // },
    // {
    //     id: 'manegement',
    //     title: 'manegement',
    //     type: 'group',
    //     children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    // },
];
export const horizontalNavigation: FuseNavigationItem[] = [
    // {
    //     id: 'dashboards',
    //     title: 'Dashboards',
    //     type: 'group',
    //     icon: 'heroicons_outline:home',
    //     children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    // },
    // {
    //     id: 'manegement',
    //     title: 'manegement',
    //     type: 'group',
    //     icon: 'heroicons_outline:qrcode',
    //     children: [], // This will be filled from defaultNavigation so we don't have to manage multiple sets of the same navigation
    // },
];
