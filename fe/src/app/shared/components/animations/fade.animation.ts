import { trigger, transition, style, animate, AnimationTriggerMetadata } from '@angular/animations';

export const fadeInOut: AnimationTriggerMetadata = trigger('fadeInOut', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
    ])
]);