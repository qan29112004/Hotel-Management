import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-line-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './line-animation.component.html',
  styleUrls: ['./line-animation.component.scss']
})
export class LineAnimationComponent {
    constructor(
        public translocoService: TranslocoService,
    ) { }
}
