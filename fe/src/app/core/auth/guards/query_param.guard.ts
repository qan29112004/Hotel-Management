import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';

export const QueryParamGuard: CanActivateFn = (route, state) => {
  
  const router: Router = inject(Router);

  // Lấy query params
  const queryParams = route.queryParams;
  const session_id = localStorage.getItem('session_id')
  // Nếu không có query param nào, redirect về trang chủ
  if ((!queryParams || Object.keys(queryParams).length === 0)&& !session_id) {
    router.navigate(['/']);
    return false; // không cho phép vào route
  }

  // Nếu có query param → cho phép
  return true;
};
