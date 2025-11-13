// destination.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { catchError, of } from 'rxjs';

export const destinationDetailResolver: ResolveFn<any> = (route) => {
  const destinationService = inject(DestinationService);
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);
  return destinationService.detailDestination(slug).pipe(
    catchError((error)=>{
        console.error("Get detail des fail:",error)
        return of(null)
    })
  );
};
