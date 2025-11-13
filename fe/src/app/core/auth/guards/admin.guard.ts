import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { map, of } from 'rxjs';
import { routeConfig } from 'app/core/uri/config.route';
import { UserService } from 'app/core/profile/user/user.service';

export const AdminGuard: CanActivateFn = (route, state) => {
    const _userService = inject(UserService);
    const router = inject(Router);

    return _userService.user$.pipe(
        // Assuming user$ is an Observable<User | undefined>
        // and is_staff is a boolean property on User
        // You may need to import 'map' and 'tap' from 'rxjs'
        // If not already imported, add: import { map, tap } from 'rxjs';
        map((user) => {
            // Nếu chưa đăng nhập hoặc không có user
            if (!user) {
                router.navigate([routeConfig.ROUTER_USER]);
                return false;
            }
            // Nếu là user (role === 3) chỉ cho phép truy cập router user
            if (user.role === 3) {
                if (!state.url.startsWith(`/${routeConfig.ROUTER_USER}`)) {
                    router.navigate([`${routeConfig.ROUTER_USER}/${routeConfig.APP_TYPE}`]);
                    return false;
                }
                return true;
            }
            // Nếu là mod (role === 2) chỉ cho phép truy cập router mod
            if (user.role === 2) {
                if (!state.url.startsWith(`/${routeConfig.ROUTER_MOD}`)) {
                    router.navigate([`${routeConfig.ROUTER_MOD}/${routeConfig.APP_TYPE}`]);
                    return false;
                }
                return true;
            }
            // Admin (role === 1) truy cập được tất cả
            return true;
        })
    );
};
