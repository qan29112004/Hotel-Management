import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'app/shared/shared.module';
import { environment } from 'environments/environment.fullstack';

export interface FieldFilterConfig {
    name: string;
    labelKey: string;
    type: 'text' | 'select' | 'date' | 'date-range' | 'checkbox' | 'range';
    required?: boolean;
    validators?: any[];
    options?: { id: string | number; name: string }[];
    placeholderKey?: string;
    errorMessages?: { [key: string]: string };
    autocompleteOptions?: string[];
    rangeFields?: { from: string; to: string };
    asyncOptionsKey?:any;
    isForeingKey?:boolean;
    relatedName?:string;
}

@Component({
    selector: 'app-generic-filter',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        SharedModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslocoModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    templateUrl: './generic-filter.component.html',
    styles: [],
})
export class GenericFilterComponent {
    @Input() mode: 'inline' | 'modal' = 'inline';
    @Input() showFilter: boolean = false;
    @Input() titleKey: string = 'content.advanced_filters';
    @Input() fields: FieldFilterConfig[] = [];
    @Input() optionDestination:any[] = [];
    @Input() optionRadio:any[] = [];
    @Output() filter = new EventEmitter<any>();
    @Output() reset = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();
    @Output() drawerOpenedChanged = new EventEmitter<boolean>();

    
    baseUrl:string = environment.baseUrl;
    filterForm: UntypedFormGroup;
    selectedRadioValues: { [key: string]: string[] } = {};
    listCheckboxValues: string[] = [];
    displayCheckbox: { [key: string]: string } = {};

    constructor(
        private _fb: UntypedFormBuilder,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        // Tạo form động dựa trên fields
        const controls = this.fields.reduce((controls, field) => {
            if ((field.type === 'date-range'||field.type === 'range') && field.rangeFields) {
                controls[field.rangeFields.from] = [null, field.validators || []];
                controls[field.rangeFields.to] = [null, field.validators || []];
            } else {
                controls[field.name] = [
                    '',
                    field.required ? [Validators.required, ...(field.validators || [])] : field.validators || [],
                ];
            }
            return controls;
        }, {});

        this.filterForm = this._fb.group(controls);
    }

    onInputChange(fieldName: string): void {
        const field = this.fields.find(f => f.name === fieldName);
        if (field?.autocompleteOptions) {
            const input = this.filterForm.get(fieldName)?.value?.toLowerCase() || '';
            field.autocompleteOptions = field.autocompleteOptions.filter(option =>
                option.toLowerCase().includes(input)
            );
        }
    }

    applyFilter(): void {
        console.log("Form values:", this.filterForm.value);
        console.log("Form valid:", this.filterForm.invalid);
        if (this.filterForm.invalid) {
            this.filterForm.markAllAsTouched();
            return;
        }

        const formValues = this.filterForm.value;
        const filterRules: any[] = [];

        this.fields.forEach(field => {
            console.log("value field: ", field.name)
            if ((field.type === 'date-range'||field.type === 'range') && field.rangeFields) {
                const from = this.formatDate(formValues[field.rangeFields.from]);
                const to = this.formatDate(formValues[field.rangeFields.to]);
                if (from && to) {
                    filterRules.push({
                        field: field.name,
                        option: 'range',
                        value: [from, to],
                    });
                }
            } else if (formValues[field.name] && field.isForeingKey) {
                console.log("value field: ", formValues[field.name])
                filterRules.push({
                    field: field.name,
                    option: 'in',
                    value: [formValues[field.name]],
                });
            }else if (field.type === 'checkbox' && this.listCheckboxValues.length > 0) {
                filterRules.push({
                    field: field.relatedName || field.name, 
                    option: 'in',
                    value: this.listCheckboxValues,
                });
            }
            else if (formValues[field.name]) {
                filterRules.push({
                    field: field.relatedName || field.name,
                    option: 'contains',
                    value: formValues[field.name],
                });
            }
        });
        console.log("Form payload:", filterRules);
        this.filter.emit(filterRules);
        this.drawerOpenedChanged.emit(false);
    }

    resetFilter(): void {
        this.filterForm.reset();
        this.filterForm.markAsPristine();
        this.filterForm.markAsUntouched();
        this.fields.forEach(field => {
            if (field.autocompleteOptions) {
                field.autocompleteOptions = [...field.autocompleteOptions]; // Reset autocomplete options
            }
        });
        this.displayCheckbox = {};
        this.listCheckboxValues = [];
        this.selectedRadioValues = {};
        this.reset.emit();
    }

    cancel(): void {
        this.close.emit();
        this.drawerOpenedChanged.emit(false);
    }

    private formatDate(date: any): string | null {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
    }
    // Xử lý khi chọn radio
    onRadioChange(fieldName: string, value: string): void {
        console.log("Radio changed:", fieldName, value);
        if (!this.selectedRadioValues[fieldName].includes(value)) {
            this.selectedRadioValues[fieldName].push(value);
            this.filterForm.get(fieldName)?.patchValue(this.selectedRadioValues[fieldName]);
            this.filterForm.get(fieldName)?.updateValueAndValidity();
        }
    }

    // Xóa giá trị radio khỏi danh sách
    removeRadioValue(fieldName: string, index: number, value?:any): void {
        this.selectedRadioValues[fieldName].splice(index, 1);
        this.filterForm.get(fieldName)?.patchValue(this.selectedRadioValues[fieldName]);
        this.filterForm.get(fieldName)?.updateValueAndValidity();
        delete this.displayCheckbox[value];
    }

    getOptionName(field: any, value: any): string {
        console.log("check");
        const amenity = this.optionRadio.find(option => option.id === value); // Sử dụng find thay vì filter
        if (amenity) {
            return `${this.baseUrl}${amenity.icon} ${amenity.name}`;
        }
        return '';
    }
    onCheckboxChange(checked: boolean, fieldName: string, value: any, option?:any) {
        if (!this.selectedRadioValues[fieldName]) {
            this.selectedRadioValues[fieldName] = [];
        }

        if (checked) {
            if (!this.selectedRadioValues[fieldName].includes(value)) {
            this.selectedRadioValues[fieldName].push(value);
            this.listCheckboxValues.push(value);
            this.displayCheckbox[option.name] = option.icon;
            console.log(this.selectedRadioValues, this.listCheckboxValues)
            }
        } else {
            this.selectedRadioValues[fieldName] = this.selectedRadioValues[fieldName].filter(v => v !== value);
            this.listCheckboxValues = this.listCheckboxValues.filter(v => v !== value);
            delete this.displayCheckbox[option.name];
        }

        // Optional: cập nhật FormControl nếu cần
        // this.form.get(fieldName)?.setValue(this.selectedValues[fieldName]);
        }
}