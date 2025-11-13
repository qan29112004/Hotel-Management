import { NgIf, CommonModule  } from '@angular/common';
import {
    Component,
    Input,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    ElementRef,
    inject,
    HostListener,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
    ActivatedRoute,
    Router,
    RouterOutlet,
    NavigationEnd,
    Scroll,
} from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { ViewChild, AfterViewInit } from '@angular/core';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { MessagesComponent } from 'app/layout/common/messages/messages.component';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { ShortcutsComponent } from 'app/layout/common/shortcuts/shortcuts.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import {
    Subject,
    takeUntil,
    combineLatest,
    filter,
    tap,
    switchMap,
} from 'rxjs';
import { GlobalAlertComponent } from '../../../common/global-alert/global-alert.component';
import { UserService } from 'app/core/profile/user/user.service';
import { ChatService } from 'app/core/chat/chat.service';
import { ChatWidgetComponent } from 'app/modules/auth/chat/chat-widget/chat-widget/chat-widget.component';
import { fuseAnimations } from '@fuse/animations';
import { FeedbackUserComponent } from 'app/modules/auth/feedback/feedback.component';
import { pushItemNavigation } from 'app/shared/utils/vertical_navigation/push_item.util';
import { AuthLayoutService } from 'app/core/auth/auth-layout.service';
import { AlertService } from 'app/core/alert/alert.service';
import { ChatUserService } from 'app/core/chat/chat-user/chat-user.service';
import { ChatChatroomService } from 'app/core/chat/chat-chatroom/chat-chatroom.service';
import { SharedModule } from 'app/shared/shared.module';
import { SseService } from 'app/core/sse/sse.service';
@Component({
    selector: 'dense-layout',
    templateUrl: './dense.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        SharedModule,
        LanguagesComponent,
        FuseFullscreenComponent,
        SearchComponent,
        ShortcutsComponent,
        MessagesComponent,
        NotificationsComponent,
        UserComponent,
        NgIf,
        CommonModule ,
        RouterOutlet,
        GlobalAlertComponent,
        ChatWidgetComponent,
        FeedbackUserComponent,
    ],
    animations: fuseAnimations,
})
export class DenseLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
    isAccessChat: boolean = false;
    @ViewChild('bubbleChatBot') bubbleChatBot: ElementRef<HTMLDivElement>;
    @ViewChild('btnOpenChat') btnOpenChat: ElementRef<HTMLButtonElement>;
    @ViewChild(FuseVerticalNavigationComponent)
    nav: FuseVerticalNavigationComponent;
    isScrollDown: boolean= false;
    isScreenSmall: boolean = true;
    isNavHovered = false;
    isBtnOpenChat: boolean = true;
    isCompleteNewChat: boolean = false;
    isTransition: boolean = true;
    window = window;
    position = { x: 0, y: 0 };
    private _isDragging = false;
    private _startPosition = { x: 0, y: 0 };
    private _wasDragging = false;
    navigation: Navigation;
    navigationAppearance: 'default' | 'dense' | 'compact' = 'compact';
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _chatService = inject(ChatService);
    private _isNavigate: boolean = false;
    private _destroy = new Subject();
    crrUser: any;
    isFeedbackOpen = false;
    innerWidth = window.innerWidth;
    isAdminPage:boolean = false;
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _userService: UserService,
        private _authLayoutService: AuthLayoutService,
        private _alertService: AlertService,
        private _chatUserService: ChatUserService,
        private _chatRoomService: ChatChatroomService,
        private sseService: SseService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Add storage event listener
        this.sseService.startWatching((data) => {
            console.log('[SSE] Received data:', data);
            if(!data.exist){
                localStorage.removeItem('session_id');
                window.dispatchEvent(new CustomEvent('session:expired', {
                    detail: { message: 'Session expired from SSE' }
                }));
            }
            // Nếu backend báo session hết hạn
            
        });
        const storageHandler = (e: StorageEvent) => {
            if (e.key === 'idChatWidget') {
                this.isCompleteNewChat = !!e.newValue;
                if (!e.newValue) {
                    this._chatService.isOpenChatBot = false;
                }
            }
        };
        window.addEventListener('storage', storageHandler);
        // Also check localStorage directly for changes within the same window
        const storedChatWidget = localStorage.getItem('idChatWidget');
        this.isCompleteNewChat = !!storedChatWidget;
        if (!storedChatWidget) {
            this._chatService.isOpenChatBot = false;
        }
        this._userService.user$.subscribe((user)=>{
            this.crrUser = user;
            
        })
        this._navigationService.navigation$.subscribe((navigation)=>{
        
                let includeIds = ['home-page', 'news-feed', 'marketplace', 'list-app', 'destination'];
                if (this.crrUser) {
                    
                    
                    if (this.crrUser.role === 3) {
                        includeIds = [
                            'home-page',
                            'chat',
                            'news-feed',
                            'marketplace',
                            'list-app',
                            'feedback',
                            'destination'
                        ];
                    } else {
                        includeIds = ['home-page', 'chat', 'news-feed', 'list-app', 'destination'];
                    }

                    if (this.crrUser.role === 1) {
                        // admin
                        includeIds.push('admin');
                        includeIds = [
                            ...includeIds,
                            ...pushItemNavigation(navigation, includeIds, 'admin', 'sticky'),
                        ];
                    } else if (this.crrUser.role === 2) {
                        // mod
                        includeIds.push('mod');
                        includeIds = [
                            ...includeIds,
                            ...pushItemNavigation(navigation, includeIds, 'mod', 'sticky'),
                        ];
                    } else if (this.crrUser.role === 3) {
                        // user
                        includeIds.push('user');
                        includeIds = [
                            ...includeIds,
                            ...pushItemNavigation(navigation, includeIds, 'user', 'sticky'),
                        ];
                    }
                }
                console.log('Include IDs for navigation:', includeIds);

                // Filter theo danh sách được phép
                this.navigation = {
                    compact: navigation.compact.filter((item) =>
                        includeIds.includes(item.id)
                    ),
                    default: navigation.default.filter((item) =>
                        includeIds.includes(item.id)
                    ),
                    futuristic: navigation.futuristic.filter((item) =>
                        includeIds.includes(item.id)
                    ),
                    horizontal: navigation.horizontal.filter((item) =>
                        includeIds.includes(item.id)
                    ),
                };
                console.log('MENU COMPACT: ', this.navigation.compact);
                console.log('MENU DEFAULT: ', this.navigation.default);
            })

        // Subscribe to navigation data và user data để filter theo role
        // combineLatest([
        //     this._navigationService.navigation$,
        //     this._userService.user$,
        // ])
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe(([navigation, user]) => {
        //         console.log('MENU VUA CALL API: ', navigation.compact);
        //         // if (!user) {
        //         //     this.navigation = {
        //         //         compact: [],
        //         //         default: [],
        //         //         futuristic: [],
        //         //         horizontal: [],
        //         //     };
        //         //     return;
        //         // }
        //         let includeIds = [];
        //         if (!user) {
        //             // Trường hợp khách vãng lai
        //             includeIds = ['home-page', 'news-feed', 'marketplace', 'list-app', 'destination']; // Các mục công khai cho khách vãng lai
        //             this.crrUser = null;
        //         } else {
        //             // Trường hợp người dùng đã đăng nhập
        //             this.crrUser = user;
        //             if (user.role === 3) {
        //                 includeIds = [
        //                     'home-page',
        //                     'chat',
        //                     'news-feed',
        //                     'marketplace',
        //                     'list-app',
        //                     'feedback',
        //                     'destination'
        //                 ];
        //             } else {
        //                 includeIds = ['home-page', 'chat', 'news-feed', 'list-app', 'destination'];
        //             }

        //             if (user.role === 1) {
        //                 // admin
        //                 includeIds.push('admin');
        //                 includeIds = [
        //                     ...includeIds,
        //                     ...pushItemNavigation(navigation, includeIds, 'admin', 'sticky'),
        //                 ];
        //             } else if (user.role === 2) {
        //                 // mod
        //                 includeIds.push('mod');
        //                 includeIds = [
        //                     ...includeIds,
        //                     ...pushItemNavigation(navigation, includeIds, 'mod', 'sticky'),
        //                 ];
        //             } else if (user.role === 3) {
        //                 // user
        //                 includeIds.push('user');
        //                 includeIds = [
        //                     ...includeIds,
        //                     ...pushItemNavigation(navigation, includeIds, 'user', 'sticky'),
        //                 ];
        //             }
        //         }
        //         console.log('Include IDs for navigation:', includeIds);

        //         // Filter theo danh sách được phép
        //         this.navigation = {
        //             compact: navigation.compact.filter((item) =>
        //                 includeIds.includes(item.id)
        //             ),
        //             default: navigation.default.filter((item) =>
        //                 includeIds.includes(item.id)
        //             ),
        //             futuristic: navigation.futuristic.filter((item) =>
        //                 includeIds.includes(item.id)
        //             ),
        //             horizontal: navigation.horizontal.filter((item) =>
        //                 includeIds.includes(item.id)
        //             ),
        //         };
        //         console.log('MENU COMPACT: ', this.navigation.compact);
        //         console.log('MENU DEFAULT: ', this.navigation.default);
        //     });

        // Subscribe to media changes
        // this._fuseMediaWatcherService.onMediaChange$
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe(({ matchingAliases }) => {
        //         // Check if the screen is small
        //         this.isScreenSmall = !matchingAliases.includes('md');

        //         // Change the navigation appearance
        //         // this.navigationAppearance = this.isScreenSmall ? 'default' : 'compact';
        //         this.navigationAppearance = 'compact';
        //     });

        // Cập nhật trạng thái ngay khi khởi tạo
        this.updateIsAccessChat(this._router.url);
        window.addEventListener('open-feedback', this.openFeedback.bind(this));

        // Lắng nghe route thay đổi để cập nhật isAccessChat
        // this._router.events
        //     .pipe(
        //         filter((event) => {
        //             return event instanceof NavigationEnd || (event instanceof Scroll && event.routerEvent instanceof NavigationEnd);
        //         }),
        //         takeUntil(this._unsubscribeAll)
        //     )
        //     .subscribe((event) => {
        //         const navigationEndEvent = event instanceof Scroll ? event.routerEvent : event;
        //         console.log('Router event:', navigationEndEvent);
        //         const currentUrl = navigationEndEvent.urlAfterRedirects;
        //         this.isAdminPage = currentUrl.includes('/admin/');
        //         console.log('isAdminPage:', this.isAdminPage);
        //         this.updateIsAccessChat(currentUrl)
        //     });
        this._router.events.pipe(
            filter((event) => {
                return event instanceof NavigationEnd || (event instanceof Scroll && event.routerEvent instanceof NavigationEnd);
            }),
            takeUntil(this._unsubscribeAll)
        )
        .subscribe(event => {
            console.log('Router event:', event);
            if (event instanceof Scroll) {
            const routerEvent = event.routerEvent;

            if (routerEvent instanceof NavigationEnd) {
                console.log('NavigationEnd (from Scroll):', routerEvent);
                console.log('URL:', routerEvent.urlAfterRedirects);
                const currentUrl = routerEvent.urlAfterRedirects;
                this.isAdminPage = currentUrl.includes('/admin/');
                console.log('isAdminPage:', this.isAdminPage);
                this.updateIsAccessChat(currentUrl)
            }
        }});
        
        // Khởi tạo vị trí button chat
        this.updateChatButtonPosition();

        // Lắng nghe sự thay đổi kích thước viewport
        window.addEventListener('resize', () => {
            this.updateChatButtonPosition();
        });

        // Check if chat widget ID exists and set isCompleteNewChat
        const idChatWidget = localStorage.getItem('idChatWidget');
        if (idChatWidget) {
            this.isCompleteNewChat = true;
        }
    }
    openFeedback(): void {
        this.isFeedbackOpen = true;
    }

    closeFeedback(): void {
        this.isFeedbackOpen = false;
    }
    navigateToSignIn(): void {
        this._router.navigate(['/sign-in']);
    }
    handleRefresh(): void {
        console.log('Feedback created, refresh data if needed...');
    }
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.innerWidth = event.target.innerWidth;
    }
    ngAfterViewInit() {
        // Polling hoặc setInterval để cập nhật trạng thái hover (do không có event public)
        setInterval(() => {
            this.isNavHovered = this.nav?.getHover();
        }, 100);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Remove storage event listener
        window.removeEventListener('storage', (e: StorageEvent) => {
            if (e.key === 'idChatWidget') {
                this.isCompleteNewChat = !!e.newValue;
                if (!e.newValue) {
                    this._chatService.isOpenChatBot = false;
                }
            }
        });

        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();

            // Báo cho service biết sidebar đã đổi
            setTimeout(() => {
                this._authLayoutService.notifySidebarToggled();
            }, 150);
        }
    }

    /**
     * Toggle the navigation appearance
     */
    toggleNavigationAppearance(): void {
        this.navigationAppearance =
            this.navigationAppearance === 'default' ? 'dense' : 'default';
    }

    // change logo
    getLogo(): string {
        return this.navigationAppearance === 'dense'
            ? 'assets/images/logo/logo.png'
            : 'assets/images/logo/logo-text.png';
    }

    /**
     * Open the chatbot
     */

    get isOpenChatBot(): boolean {
        return this._chatService.isOpenChatBot;
    }
    set isOpenChatBot(val: boolean) {
        this._chatService.isOpenChatBot = val;
    }
    closeChat(): void {
        this.isOpenChatBot = false;
    }

    TurnOffBtnOpenChat(): void {
        this.isBtnOpenChat = false;
        if (this.isOpenChatBot) {
            this.isOpenChatBot = false;
        }
    }

    TurnOnBtnOpenChat(): void {
        this.isBtnOpenChat = true;
        // Reset về vị trí mặc định khi bật lại button
        this._wasDragging = false;
        this.updateChatButtonPosition();
    }

    openChatbot(Event: MouseEvent): void {
        if (this._wasDragging) {
            Event.preventDefault();
            this._wasDragging = false;
            return;
        }

        console.log('Open chat bubble clicked');
        // this._chatService.createNewSessionChat(this.crrUser, this._isNavigate)
        //     .pipe(
        //         takeUntil(this._unsubscribeAll)
        //     )
        //     .subscribe({
        //         next: (idChatWidget) => {
        //             console.log('Got chat widget ID:', idChatWidget);
        //             localStorage.setItem('idChatWidget', idChatWidget);
        //             this.isCompleteNewChat=true;
        //             this.toggleChatVisibility();

        //         },
        //         error: (error) => {
        //             console.error('Error creating chat session:', error);
        //         }
        //     });
        this.isCompleteNewChat = true;
        this.toggleChatVisibility();
    }

    toggleChatVisibility(): void {
        this.isOpenChatBot = !this.isOpenChatBot;
        if (this.isOpenChatBot === true) {
            this.isTransition = false;
        }
    }

    // Hàm nay sẽ thay thế hàm openChatbot nếu width screen là mobile
    navigateToChat(): void {
        this._userService
            .get()
            .pipe(
                switchMap((user) => this._chatUserService.getIdUser(user)), // lấy userId trong Firestore
                switchMap((userId) =>
                    this._chatRoomService.getChatRoomIdByUserId(userId)
                ) // lấy chatRoomId từ userId
            )
            .subscribe({
                next: (chatId) => {
                    if (chatId) {
                        localStorage.setItem('idChatWidget', chatId);
                        this._router.navigate(['/chat', chatId]);
                    }
                },
                error: (err) => {
                    console.error('Error fetching chatId:', err);
                },
            });
    }

    handleChatClick(event: MouseEvent) {
        if (this.innerWidth <= 480) {
            this.navigateToChat();
        } else {
            this.openChatbot(event);
        }
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        this.isScrollDown = scrollY > 1; // thay đổi ngưỡng tùy bạn
    }

    @HostListener('document:pointerdown', ['$event'])
    onPointerDown(event: PointerEvent) {
        if (event.target === this.bubbleChatBot?.nativeElement) {
            console.log('Pointer down on chat bubble');
            event.preventDefault();
            this._wasDragging = false;
            this._isDragging = true;
            this._startPosition.x = event.clientX - this.position.x;
            this._startPosition.y = event.clientY - this.position.y;
        }
    }
    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent) {
        if (this._isDragging) {
            const deltaX =
                event.clientX - (this.position.x + this._startPosition.x);
            const deltaY =
                event.clientY - (this.position.y + this._startPosition.y);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > 5) {
                this._wasDragging = true;
            }

            let newX = event.clientX - this._startPosition.x;
            let newY = event.clientY - this._startPosition.y;

            const ButtonSize = 95;
            const Margin = 55;

            newX = Math.max(
                Margin,
                Math.min(newX, window.innerWidth - ButtonSize - Margin)
            );
            newY = Math.max(
                Margin,
                Math.min(newY, window.innerHeight - ButtonSize - Margin)
            );

            this.position.x = newX;
            this.position.y = newY;
        }
    }

    @HostListener('document:pointerup')
    onPointerUp() {
        this._isDragging = false;
    }

    private updateIsAccessChat(url: string) {
        this.isAccessChat = /^\/chat(\/[^\/]*)?$/.test(url);
    }

    /**
     * Reset vị trí button chat về vị trí mặc định
     */
    resetChatButtonPosition(): void {
        this._wasDragging = false;
        this.updateChatButtonPosition();
    }

    private updateChatButtonPosition(): void {
        const ButtonSize = 95;
        const Margin = 55;

        // Tính toán vị trí mặc định (góc dưới bên phải)
        let newX = window.innerWidth - ButtonSize - 2 * Margin;
        let newY = window.innerHeight - ButtonSize - Margin;

        // Đảm bảo button không bị đặt ngoài viewport
        newX = Math.max(
            Margin,
            Math.min(newX, window.innerWidth - ButtonSize - Margin)
        );
        newY = Math.max(
            Margin,
            Math.min(newY, window.innerHeight - ButtonSize - Margin)
        );

        // Chỉ cập nhật vị trí nếu button chưa được kéo thả (vị trí mặc định)
        if (!this._wasDragging) {
            this.position = { x: newX, y: newY };
        } else {
            // Nếu đã kéo thả, đảm bảo button vẫn nằm trong viewport
            this.position.x = Math.max(
                Margin,
                Math.min(
                    this.position.x,
                    window.innerWidth - ButtonSize - Margin
                )
            );
            this.position.y = Math.max(
                Margin,
                Math.min(
                    this.position.y,
                    window.innerHeight - ButtonSize - Margin
                )
            );
        }
    }
}
