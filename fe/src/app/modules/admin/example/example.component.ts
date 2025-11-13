import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector     : 'example',
    imports: [CdkScrollable],
    standalone   : true,
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ExampleComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
