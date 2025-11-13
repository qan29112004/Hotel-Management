import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-card-user',
    standalone: true,
    imports: [CommonModule, MatIconModule, MatTooltipModule],
    templateUrl: './card-user.component.html',
    styles: ``,
})
export class CardUserComponent {
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() value: number = 0;
    @Input() iconPath: string = '';
    @Input() bgColor: string = 'bg-primary'; // default
}
