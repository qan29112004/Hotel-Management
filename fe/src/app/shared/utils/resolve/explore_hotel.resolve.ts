// explore-hotels.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of, map } from 'rxjs';
import { HotelService } from 'app/core/admin/hotel/hotel.service';

export const exploreHotelsResolver: ResolveFn<any> = (route) => {
  const hotelService = inject(HotelService);
  const params = route.queryParamMap; // queryParamMap safer than queryParams

  // Parse rooms array from query params
  const rooms: { adults: number; children: number }[] = [];
  let i = 0;
  while (true) {
    const adultsParam = params.get(`rooms[${i}][adults]`);
    const childrenParam = params.get(`rooms[${i}][children]`);
    if (adultsParam === null && childrenParam === null) break;

    rooms.push({
      adults: parseInt(adultsParam || '0', 10),
      children: parseInt(childrenParam || '0', 10),
    });
    i++;
  }

  // Build search data
  const searchData = {
    limit: 2,
    offset: 0,
    destination: params.get('dest') || '',
    check_in: params.get('checkin') || '',
    check_out: params.get('checkout') || '',
    code: params.get('code') || '',
    rooms
  };

  // Call API
  return hotelService.getExploreHotels(searchData).pipe(

    map(res=>({
        apiData: res,
        searchData: searchData
    })),
    catchError((error) => {
      console.error('Failed to load hotels:', error);
      return of(null);
    })
  );
};
