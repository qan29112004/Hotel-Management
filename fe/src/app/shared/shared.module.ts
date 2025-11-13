import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { CustomButtonComponent } from './components/custom-button/custom-button.component';
import { FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { ReactiveFormsModule } from '@angular/forms';
import { FuseAlertComponent } from '@fuse/components/alert';
import { RouterLink } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MultiSelectComponent } from './components/multi-select/multi-select.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CustomDatepickerComponent } from './components/custom-datepicker/custom-datepicker.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { CapitalizePipe } from './pipes/capital.pipe';

export const SharedImports = [
    CustomInputComponent,
    CustomButtonComponent,
    FuseAlertComponent,
    MultiSelectComponent,
    CustomDatepickerComponent,
];

@NgModule({
    imports: [
        SharedImports,
        CommonModule,
        TranslocoModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        FormsModule,
        MatStepperModule,
        ReactiveFormsModule,
        RouterLink,
        DragDropModule,
        CdkScrollable,
        MatTooltipModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        MatRadioModule,
        CapitalizePipe
    ],
    exports: [
        SharedImports,
        CommonModule,
        TranslocoModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        FormsModule,
        MatStepperModule,
        ReactiveFormsModule,
        RouterLink,
        DragDropModule,
        CdkScrollable,
        MatTooltipModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        MatRadioModule,
        CapitalizePipe
    ],
})
export class SharedModule {}
