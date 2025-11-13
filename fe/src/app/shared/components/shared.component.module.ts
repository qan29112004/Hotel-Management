import { NgModule } from '@angular/core';
import { CustomInputComponent } from './custom-input/custom-input.component';
import { CustomButtonComponent } from './custom-button/custom-button.component';
import { FuseAlertComponent } from '@fuse/components/alert';
import { CunstomSelectComponent } from './cunstom-select/cunstom-select.component';
import { MultiSelectComponent } from './multi-select/multi-select.component';

export const SharedComponentImports = [
    CustomInputComponent,
    CustomButtonComponent,
    FuseAlertComponent,
    CunstomSelectComponent,
    MultiSelectComponent,
];

@NgModule({
    imports: [SharedComponentImports],
    exports: [SharedComponentImports],
})
export class SharedComponentModule {}
