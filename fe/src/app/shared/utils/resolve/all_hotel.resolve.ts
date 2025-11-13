// destination.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
export const hotelResolver: ResolveFn<any> = (route) => {
  const hotelService = inject(HotelService);
  return hotelService.getHotels();
};
