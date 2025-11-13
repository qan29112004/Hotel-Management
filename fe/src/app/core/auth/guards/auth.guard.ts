import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

function getDeepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route;
}
export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const childRoute = getDeepestChild(route);
    const isPublic = childRoute.data?.['public'] === true;
    if (isPublic) {
        return true;
    }

    // Check the authentication status
    return inject(AuthService).check().pipe(
        switchMap((authenticated) => {
            const isLoginPage = state.url.includes('/sign-in');
            console.log("CHeck: ", authenticated)
            if (!authenticated && !isLoginPage) {
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                return of(urlTree);
            }
    
            return of(true);
        })
    );
};
