import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from '@angular/common';
@Component({
  standalone:true,
  selector: "app-rating",
  templateUrl: "./rating.component.html",
  imports: [CommonModule],
  styleUrls: ["./rating.component.scss"]
})
export class RatingComponent implements OnInit {
  starClassName = "star-rating-blank";
  @Input() starId;
  @Input() rating;
  @Input() isDisableClick:boolean = true;

  @Output() leave: EventEmitter<number> = new EventEmitter();
  @Output() enter: EventEmitter<number> = new EventEmitter();
  @Output() bigClick: EventEmitter<number> = new EventEmitter();
  constructor() {}

  ngOnInit() {
    console.log(this.starId);
    console.log(this.rating);

    if (this.rating >= this.starId) {
      this.starClassName = "star-rating-filled";
    }
  }

  onenter() {
    this.enter.emit(this.starId);
  }

  onleave() {
    this.leave.emit(this.starId);
  }

  starClicked() {
    this.bigClick.emit(this.starId);
  }
}