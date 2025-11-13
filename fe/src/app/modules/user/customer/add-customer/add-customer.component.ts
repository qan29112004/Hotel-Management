import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { CustomerService } from 'app/core/user/customer/customer.service';
import { FuseAlertType } from '@fuse/components/alert';
import { fuseAnimations } from '@fuse/animations';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { Router } from '@angular/router';
import { routeConfig } from 'app/core/uri/config.route';
import { CustomFormTemplateService } from 'app/core/admin/custom-form-template/custom-form-template.service';
import { map, Observable, startWith, takeUntil } from 'rxjs';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { MatSelectChange } from '@angular/material/select';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDateFormats } from '@angular/material/core';
import { UserService } from 'app/core/profile/user/user.service';

// Định nghĩa định dạng ngày tháng cho tiếng Việt
export const VI_DATE_FORMATS: MatDateFormats = {
    parse: {
        dateInput: 'DD/MM/YYYY',
    },
    display: {
        dateInput: 'dd/MM/yyyy',
        monthYearLabel: 'MM yyyy',
        dateA11yLabel: 'dd/MM/yyyy',
        monthYearA11yLabel: 'MM yyyy',
    },
};

@Component({
    selector: 'app-add-customer',
    standalone: true,
    imports: [CommonModule, SharedModule],
    animations: fuseAnimations,
    templateUrl: './add-customer.component.html',
    styles: `
    .input-none-error ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
    `,
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
        { provide: MAT_DATE_FORMATS, useValue: VI_DATE_FORMATS },
    ],
})
export class AddCustomerComponent {
    alert: { type: FuseAlertType; code: any } = {
        type: 'success',
        code: [],
    };
    cityOptions: any[] = [];
    districtOptions: any[] = [];
    wardOptions: any[] = [];
    sourceOptions: any[] = [];
    companiesOptions: any[] = [];
    departmentOptions: any[] = [];
    AssignedByOptions: any;
    showAlert: boolean = false;
    dataForm = [];
    dataTemplate = [];
    dynamicForm!: FormGroup;
    loading = true;
    error = '';
    empty = false;
    filteredOptions: Observable<any[]>;
    autocompleteControl = new FormControl();
    routerList = `/${routeConfig.ROUTER_USER}/${routeConfig.CUSTOMER_LIST}`;
    today = new Date();
    tableId: number = 0;

    constructor(
        private _formBuilder: FormBuilder,
        private _customerService: CustomerService,
        private _alertService: AlertService,
        private _translocoService: TranslocoService,
        private _router: Router,
        private _customFormTemplateService: CustomFormTemplateService,
        private _userManagementService: UserManagementService,
        private _userService: UserService
    ) {}

    ngOnInit(): void {
        //  this._userService.user$
        //             .pipe(takeUntil(this._unsubscribeAll))
        //             .subscribe((user: User) =>
        //             {
        //                 this.user = user;

        //                 // Mark for check
        //                 this._changeDetectorRef.markForCheck();
        //             });
        this.loadForms();

        this.getAssignedBy();

        this.getCompanies();
        this.getSource();
        this.getCity(); // Gọi API khi component khởi tạo
        // this.setupAutocomplete();

        // this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
        //     startWith(''),
        //     map((value) => this._filter(value || ''))
        // );
    }
    // private setupAutocomplete() {
    //     this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
    //         startWith(''),
    //         map((value) => this._filterCities(value))
    //     );
    // }
    // private _filterCities(value: string | any): any[] {
    //     const filterValue =
    //         typeof value === 'string'
    //             ? value.toLowerCase()
    //             : value?.name?.toLowerCase() || '';

    //     return this.cityOptions.filter((option) =>
    //         option.name.toLowerCase().includes(filterValue)
    //     );
    // }

    // displayFn(city?: any): string {
    //     return city ? city.name : '';
    // }
    // private _filter(value: string | any): any[] {
    //     const filterValue =
    //         typeof value === 'string'
    //             ? value.toLowerCase()
    //             : value.name.toLowerCase();

    //     return this.dataForm[0].select_options.filter((option) =>
    //         option.name.toLowerCase().includes(filterValue)
    //     );
    // }

    // displayFn(option?: any): string {
    //     return option ? option.name : '';
    // }

    onTemplateChange(event: MatSelectChange): void {
        console.log('Đã chọn biểu mẫu:', event.value);
        this.tableId = event.value;
        this.fetchDataForm();
    }

    fetchDataForm() {
        this.loading = true;
        this.error = '';
        this.empty = false;

        this._customerService.getDynamicForm(this.tableId).subscribe({
            next: (response: any) => {
                if (
                    response &&
                    Array.isArray(response) &&
                    response.length > 0
                ) {
                    this.dataForm = this.addSelectOptions(response);
                    console.log(this.dataForm);

                    this.dynamicForm = this.createDynamicForm(this.dataForm);
                } else {
                    this.empty = true;
                }
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Lỗi khi tải dữ liệu. Vui lòng thử lại.';
                this.loading = false;
            },
        });
    }
    addSelectOptions(dataForm) {
        // Định nghĩa các options theo name
        const optionsByName = {
            salutation: [
                { name: 'Anh', id: 'anh' },
                { name: 'Chị', id: 'chi' },
                { name: 'Ông', id: 'ong' },
                { name: 'Bà', id: 'ba' },
            ],
            source_name: this.sourceOptions,
            address_provinces_name: this.cityOptions,
            address_districts_name: this.districtOptions,
            address_wards_name: this.wardOptions,
            department: this.departmentOptions,
            company: this.companiesOptions,
            assigned_by: this.AssignedByOptions,
        };

        // Duyệt qua từng section
        return dataForm.map((section) => ({
            ...section,
            // Xử lý các trường trong fields
            fields: section.fields.map((field) => {
                if (field.type === 'select') {
                    // const isDistrict = field.name === 'address_districts_name';
                    // const isWard = field.name === 'address_wards_name';
                    return {
                        ...field,
                        select_options: optionsByName[field.name] || [],
                        // disabled:
                        //     (isDistrict && !this.districtOptions) ||
                        //     (isWard && !this.wardOptions),
                    };
                }
                return field;
            }),
        }));
    }

    getCity(): void {
        this._customerService.getLocate().subscribe({
            next: (response) => {
                this.cityOptions = response;
            },
            error: (err) => {
                console.error('API Error:', err);
            },
        });
    }

    getSource() {
        this._customerService.getSource().subscribe({
            next: (response) => {
                this.sourceOptions = response;
            },
            error: (err) => {
                console.error('API Error:', err);
            },
        });
    }
    getCompanies() {
        this._customerService.getCompanies().subscribe({
            next: (response) => {
                this.companiesOptions = response;
            },
            error: (err) => {
                console.error('API Error:', err);
            },
        });
    }

    getAssignedBy() {
        const payload = {
            page_index: 1,
            page_size: 9999,
            filter_rules: [],
            search_rule: {},
            sort_rule: {},
        };
        this._userManagementService.getUsers(payload).subscribe({
            next: (response) => {
                if (response.data.users) {
                    const transformedData = (response.data.users || [])
                        .filter((user) => {
                            return user?.status === 1;
                        })
                        .map((user) => ({
                            id: user.id,
                            name: user.fullName,
                        }));

                    this.AssignedByOptions = transformedData;
                }
            },
            error: (err) => {
                console.error('API Error:', err);
            },
        });
    }
    onChangeSelected(value, field) {
        if (field === 'address_provinces_name') {
            this.districtOptions =
                this.cityOptions.find((p) => p.id === value)?.districts || [];
            this.wardOptions = [];

            console.log(this.districtOptions);
        } else if (field === 'address_districts_name') {
            this.wardOptions =
                this.districtOptions.find((p) => p.id === value)?.wards || [];
        } else if (field === 'source_name') {
            const selectedOption = this.sourceOptions?.find(
                (opt: any) => opt.id === value
            );
            this.dynamicForm.get('source').setValue(selectedOption.name);
        } else if (field === 'assigned_by') {
            const selectedOption = this.AssignedByOptions?.find(
                (opt: any) => opt.id === value
            );
            this.dynamicForm.get('assigned').setValue(selectedOption.name);
        }
    }
    loadForms(): void {
        const payload = {
            page_index: 1,
            page_size: 9999,
            filter_rules: [],
            search_rule: {},
            sort_rule: {},
        };
        this._customFormTemplateService.getForms(payload).subscribe({
            next: (response: any) => {
                this._customFormTemplateService.forms$.subscribe((forms) => {
                    this.dataTemplate = forms;
                    const defaultForm = forms.find(
                        (item) => item.template_type === 'default'
                    );
                    if (defaultForm) {
                        this.tableId = defaultForm.id || 0;
                        this.fetchDataForm();
                    }
                });
            },
            error: (err) => {
                // this.isLoading = false;
                console.error('API Error:', err);
            },
        });
    }

    createDynamicForm(dataForm: any[]): FormGroup {
        const group: any = {};

        dataForm.forEach((section) => {
            section.fields.forEach((field) => {
                const validators = [];

                if (field.config?.required)
                    validators.push(Validators.required);
                if (field.config?.max_length)
                    validators.push(
                        Validators.maxLength(field.config.max_length)
                    );
                if (field.name.toLowerCase().includes('email'))
                    validators.push(AuthUtils.emailValidator);
                if (field.name.toLowerCase().includes('phone'))
                    validators.push(Validators.pattern(/^[0-9]{10,11}$/));
                if (
                    field.name.toLowerCase().includes('birth') ||
                    field.name.toLowerCase().includes('date')
                ) {
                    validators.push(maxDateValidator(this.today));
                }
                if (field.name === 'source_name')
                    group['source'] = new FormControl('');
                if (field.name === 'assigned_by')
                    group['assigned'] = new FormControl('');
                group['status'] = new FormControl('Khách hàng mới');
                group['status_id'] = new FormControl('Khach_hang_moi');

                let value = field.value || '';

                if (field.type === 'date' && field.value) {
                    const date = new Date(field.value);
                    const dateOnly = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                    );
                    field.value = dateOnly;
                }

                group[field.name] = new FormControl(value, validators);

                field.value = value;
            });
        });

        return this._formBuilder.group(group);
    }

    onSubmit(): void {
        if (this.dynamicForm.invalid) {
            return;
        }
        // Disable the form
        this.dynamicForm.disable();
        // Hide the alert
        this.showAlert = false;
        const data = this.dynamicForm.value;
        this._customerService.createCustomer(data).subscribe({
            next: (res) => {
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'other.success_title'
                    ),
                    message: 'Tạo khách hàng thành công',
                    type: 'success',
                });

                this._router.navigate([this.routerList]);

                this.dynamicForm.reset();
                this.dynamicForm.enable();
            },
            error: (err) => {
                const errors = err?.error?.errors;

                this.alert = {
                    type: 'error',
                    code: [],
                };
                if (
                    err?.error?.code === 'VALIDATION_ERROR' &&
                    Array.isArray(err.error.errors)
                ) {
                    this.alert.code = err.error.errors.map((e: any) => {
                        return `errors.fields.${e.field}`;
                    });
                } else {
                    this.alert.code = [
                        `errors.${err?.error?.code}` || 'errors.default',
                    ];
                }

                this.dynamicForm.enable();

                // Show the alert
                this.showAlert = true;
            },
        });
    }
}

export function maxDateValidator(maxDate: Date): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const value = control.value;
        if (value && new Date(value) > maxDate) {
            return { maxDate: true };
        }
        return null;
    };
}
