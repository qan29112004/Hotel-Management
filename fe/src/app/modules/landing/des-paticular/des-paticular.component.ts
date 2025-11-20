import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MapComponent } from 'app/shared/components/map/map.component';
import { SharedModule } from 'app/shared/shared.module';
import { environment } from 'environments/environment.fullstack';
import { TranslocoModule } from '@ngneat/transloco';
@Component({
  selector: 'app-des-paticular',
  standalone: true,
  imports: [CommonModule, MapComponent, SharedModule,TranslocoModule],
  templateUrl: './des-paticular.component.html',
  styles: ``
})
export class DesPaticularComponent implements OnInit {
  baseUrl: string = environment.baseUrl;
  regionName:string = '';
  isChoose:string;
  destinationData:any;
  private route = inject(ActivatedRoute);
  private router = inject(Router)
  ngOnInit() {
    console.log("chạy vao component")
    this.route.data.subscribe(data =>{
      console.log("detail: ",data)
      this.destinationData = data['destination'].data;
    })
    ;
  }
  encodeFileUrl(thumbnail: string) {
    if(thumbnail){
      const lastSlash = thumbnail.lastIndexOf('/');
      const path = thumbnail.substring(0, lastSlash + 1);
      const filename = thumbnail.substring(lastSlash + 1);
      return path + encodeURIComponent(filename);
    }
  }

  chooseHotel(uuid:string){
    if(!this.isChoose || this.isChoose !== uuid){
      this.isChoose = uuid;
    } else if (this.isChoose === uuid){
      this.isChoose = undefined;
    }
  }
  viewHotel(slug:string){
    this.router.navigate([`hotel/${slug}`])
  }
}
