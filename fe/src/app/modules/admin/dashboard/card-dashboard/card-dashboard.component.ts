import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
@Component({
    selector: 'app-card-dashboard',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatTooltipModule,TranslocoModule],
    templateUrl: './card-dashboard.component.html',
    styles: ``,
})
export class CardDashboardComponent {
    constructor(
       private translocoService: TranslocoService
     ) { }
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() value: number = 0;
    @Input() iconPath: string = '';
    @Input() bgColor: string = 'bg-primary'; // default
}
