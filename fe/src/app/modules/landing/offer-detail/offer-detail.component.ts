import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-detail.component.html',
  styles: ``
})
export class OfferDetailComponent implements OnInit {

ngOnInit(): void {
  console.log("có vào đaay")  
  // this.titleService.setTitle("Save 20% off")
    
}
}
