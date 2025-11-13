// destination.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DestinationService } from 'app/core/admin/destination/destination.service';

export const destinationResolver: ResolveFn<any> = (route) => {
  const destinationService = inject(DestinationService);
  return destinationService.getDestinations();
};
