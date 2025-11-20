import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgIf } from '@angular/common';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { routeConfig } from 'app/core/uri/config.route';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { SharedModule } from 'app/shared/shared.module';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'user',
    standalone: true,
    imports: [
        MatButtonModule,
        MatMenuModule,
        NgIf,
        MatIconModule,
        NgClass,
        MatDividerModule,
        SharedModule
    ],
})
export class UserComponent implements OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: User;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _authService: AuthService,
        public translocoService: TranslocoService,
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                if (user.avatar && user.avatar.startsWith("https://lh3.googleusercontent.com")) {
                    user.avatar = user.avatar.replace("https://lh3.googleusercontent.com", "/proxy/google-image/");
                }
                this.user = user;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void {
        if (!this.user) {
            return;
        }
        this.user.status = status;
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Sign out
     */
    signOut(): void {
        this._authService.signOut().subscribe(() => {
            this._router.navigate(['/sign-in']);
        });
    }
    navigateToUserInfor() {
        this._router.navigateByUrl(`${routeConfig.AUTH_USER_INFOR}`);
    }
    navigateToChangePassword() {
        this._router.navigateByUrl(`${routeConfig.AUTH_CHANGE_PASS}`);
    }
    navigateToMyBooking(){
        this._router.navigateByUrl(`${routeConfig.MY_BOOKING}`)
    }
}
