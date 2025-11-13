import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from 'app/shared/components/map/map.component';
import { SharedModule } from 'app/shared/shared.module';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { Hotel } from 'app/core/admin/hotel/hotel.types';
import { environment } from 'environments/environment.fullstack';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { CapitalizePipe } from 'app/shared/pipes/capital.pipe';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-destination',
  standalone: true,
  imports: [CommonModule, MapComponent, SharedModule, CapitalizePipe],
  templateUrl: './destination.component.html',
  styles: ``
})
export class DestinationComponent {
  baseUrl = environment.baseUrl;
  private checkDataHotel = this.hotelService.getHotelData();
  listHotels: Hotel[] = [];
  listDestinations:any[] = [];
  constructor(private hotelService: HotelService, private destinationService:DestinationService, private route: ActivatedRoute, private _route:Router) {}
  
  ngOnInit(){
    this.route.data.subscribe(data => {
      this.listDestinations = data['destination'].data; // ← Không phải Observable nữa, là dữ liệu thật
      this.listHotels = data['hotel'].data
    });
  }

  // ngAfterViewInit(): void {
  //   if (!this.destinationService.check()) {
  //     this.destinationService.getDestinations().subscribe({
  //       next: (res) => {
  //         this.listDestinations = res.data;
  //         console.log('listdes: ', this.listDestinations)
  //       }
  //     });
  //   } else {
  //     this.destinationService.destinations$.subscribe({
  //       next: (res) => {
  //         this.listDestinations = res.data;
  //         console.log('listdes: ', this.listDestinations)
  //       }
  //     })  
  //     };
  //   }
  encodeFileUrl(thumbnail: string) {
    if(thumbnail){
      const lastSlash = thumbnail.lastIndexOf('/');
      const path = thumbnail.substring(0, lastSlash + 1);
      const filename = thumbnail.substring(lastSlash + 1);
      return path + encodeURIComponent(filename);
    }
  }

  navigateDestinationPage(slug:string){
    this._route.navigate(['', slug]);
  }
}
