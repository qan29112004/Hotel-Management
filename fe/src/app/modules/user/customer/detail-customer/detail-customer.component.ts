import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { FilterComponent } from '../../../../shared/components/filter/filter.component';
import { debounceTime, forkJoin, Subject } from 'rxjs';
import {
    trigger,
    state,
    style,
    transition,
    animate,
} from '@angular/animations';
import { CustomerService } from 'app/core/user/customer/customer.service';
import {
    CustomerResponse,
    FieldConfig,
    RecordData,
    RecordItem,
    SectionConfig,
} from 'app/core/user/customer/customer.types';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { routeConfig } from 'app/core/uri/config.route';
import { FuseAlertType } from '@fuse/components/alert';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDateFormats } from '@angular/material/core';

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
    selector: 'app-detail-customer',
    standalone: true,
    imports: [SharedModule, CommonModule, MatTooltipModule, FilterComponent],
    templateUrl: './detail-customer.component.html',
    animations: [
        trigger('dropdownAnimation', [
            state(
                'closed',
                style({
                    height: '0px',
                    opacity: 0,
                    overflow: 'hidden',
                })
            ),
            state(
                'open',
                style({
                    height: '*',
                    opacity: 1,
                    overflow: 'hidden',
                })
            ),
            transition('closed <=> open', [animate('300ms ease-in-out')]),
        ]),
    ],
    styles: ``,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'vi-VN' },
        { provide: MAT_DATE_FORMATS, useValue: VI_DATE_FORMATS },
    ],
})
export class DetailCustomerComponent implements OnInit {
    // Tab
    activeTab: string = 'general';

    // Khai báo form
    formJson = [];
    optionsByName: { [key: string]: any[] } = {};

    // Sắp xếp
    sortField: string | null = null;
    sortOption: 'asc' | 'desc' | null = null;

    // Data danh sách khách hàng
    customerList: RecordItem[] = [];
    filteredCustomerList = [...this.customerList];
    customerData: RecordItem[] = [];

    cityOptions: any[] = [];
    districtOptions: any[] = [];
    wardOptions: any[] = [];
    sourceOptions: any[] = [];
    companiesOptions: any[] = [];
    departmentOptions: any[] = [];
    AssignedByOptions: any;

    loading = true;
    error = '';
    empty = false;

    dataRecord: any = {};

    today = new Date();

    // Fix data cứng tạm thời
    statusOptions = [
        { name: 'Khách hàng mới', id: 1 },
        { name: 'Tiềm năng', id: 2 },
        { name: 'Cơ hội', id: 3 },
        { name: 'Chính thức', id: 4 },
        { name: 'Rời bỏ', id: 5 },
    ];
    userOptions = [
        { id: 1, name: 'Nguyễn Thị Cẩm Tú' },
        { id: 2, name: 'Vũ Đức Anh' },
        { id: 3, name: 'Nguyễn Văn Huy' },
        { id: 4, name: 'Nguyễn Văn Đại' },
        { id: 5, name: 'Nguyễn Trung Kiên' },
        { id: 6, name: 'Lê Thị Hồng Nhung' },
        { id: 7, name: 'Trần Quốc Bảo' },
        { id: 8, name: 'Phạm Thị Mai Linh' },
        { id: 9, name: 'Hoàng Văn Nam' },
        { id: 10, name: 'Đặng Thị Bích Ngọc' },
        { id: 11, name: 'Bùi Minh Tuấn' },
        { id: 12, name: 'Đỗ Thị Thu Hà' },
        { id: 13, name: 'Ngô Đức Mạnh' },
        { id: 14, name: 'Trịnh Thị Lan Anh' },
        { id: 15, name: 'Tạ Quang Huy' },
    ];

    // Tìm kiếm
    searchValue: string = '';
    searchInputChanged: Subject<string> = new Subject<string>();

    // Khai báo biến cho click và hover khách hàng
    hoveredCustomer: number | null = null;
    selectedCustomerId: number | null = null;
    selectedCustomerDetail: any = null;

    // Khai báo biến cho dropdown
    isContactOpen = false;
    isCompanyOpen = false;

    // Mode detail và edit
    isEditMode = false;

    // Form
    dynamicForm!: FormGroup;
    id!: number;

    dataForm: any[] = [];

    // Alert
    alert: { type: FuseAlertType; code: any } = {
        type: 'success',
        code: [],
    };
    showAlert: boolean = false;

    constructor(
        private _customerService: CustomerService,
        private _alertService: AlertService,
        private _router: Router,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private fb: FormBuilder,
        private _translocoService: TranslocoService,
        private _userManagementService: UserManagementService
    ) {}

    ngOnInit(): void {
        const waitFor = (fn: () => void, delay = 200) =>
            new Promise<void>((resolve) => {
                fn();
                setTimeout(resolve, delay);
            });
        Promise.all([
            waitFor(() => this.getAssignedBy()),

            waitFor(() => this.getCompanies()),
            waitFor(() => this.getSource()),
            waitFor(() => this.getCity()),
        ]).then(() => {
            // Sau khi các API trên được gọi xong

            this.route.paramMap.subscribe((params) => {
                const idParam = params.get('id');
                this.id = idParam ? Number(idParam) : 0;

                if (this.id > 0) {
                    this.selectedCustomerId = this.id;
                    this.loadCustomerDetail(this.id);
                } else {
                    this._router.navigate(['/not-found']);
                }
            });

            this.route.url.subscribe((urlSegments) => {
                this.isEditMode = urlSegments.some(
                    (seg) => seg.path === 'edit'
                );
            });

            this.loadData();
            this.loadCustomerDetail(this.id); // API lấy chi tiết khách hàng

            this.searchInputChanged
                .pipe(debounceTime(500))
                .subscribe(() => this.reloadCustomers());

            this.cdr.detectChanges();
        });
    }

    // Hàm lấy API chi tiết khách hàng
    loadCustomerDetail(id: number): void {
        this._customerService.getCustomerDetail(id).subscribe((res) => {
            const recordValues = res.data.record_data.data;
            const createdAt = res.data.record_data.created_at;
            const updatedAt = res.data.record_data.updated_at;
            const assigned = res.data.record_data.assigned;
            const source = res.data.record_data.source;
            this.selectedCustomerId = {
                ...recordValues,
                created_at: createdAt,
                updated_at: updatedAt,
                assigned: assigned,
                source: source,
            };
            this.dataRecord = res.data.record_data.data;
            this.initLocationOptions();

            this.formJson = res.data.section_data.map((section) => {
                const updatedFields = section.fields.map((field) => {
                    // Mapping theo name của field
                    let value = recordValues[field.name] || '';

                    // Xử lý đặc biệt nếu cần (ví dụ: ngày giờ)
                    if (field.label === 'Ngày khởi tạo') value = createdAt;
                    if (field.label === 'Ngày cập nhật') value = updatedAt;
                    if (field.label === 'Người phụ trách') value = assigned;
                    if (field.label === 'Nguồn') value = source;

                    return {
                        ...field,
                        value: value,
                    };
                });

                return {
                    ...section,
                    fields: updatedFields,
                };
            });

            this.dataForm = this.addSelectOptions(this.formJson);
            // Gán giá trị vào field.value trước khi tạo form control
            this.populateValuesFromCustomer();

            this.formJson = this.addSelectOptions(this.formJson);
            // Tạo form group với giá trị cập nhật
            this.initDynamicForm(this.dataForm);

            this.dynamicForm.get('status')?.valueChanges.subscribe((value) => {
                this.dataRecord.status = value;
            });

            this.cdr.detectChanges();
        });
    }

    reloadCustomers(): void {
        this.loadCustomerList();
    }

    // Tải dữ liệu
    loadData(): void {
        this.loadCustomerList();
    }

    // Hàm lấy API danh sách khách hàng
    loadCustomerList(): void {
        const payload = this.getPayload();
        this._customerService.getCustomerList(payload).subscribe({
            next: (response: CustomerResponse) => {
                this._customerService.customers$.subscribe((customers) => {
                    this.customerList = customers;
                    this.filteredCustomerList = [...this.customerList];
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                console.error('API Error:', err);
            },
        });
    }

    sortBy(field: string) {
        if (this.sortField === field) {
            if (this.sortOption === 'asc') {
                this.sortOption = 'desc';
            } else if (this.sortOption === 'desc') {
                this.sortField = null;
                this.sortOption = null;
            } else {
                this.sortOption = 'asc';
            }
        } else {
            this.sortField = field;
            this.sortOption = 'asc';
        }
        this.loadCustomerList();
    }

    // Lấy rule sắp xếp
    getSortRule(): any {
        if (!this.sortField || !this.sortOption) {
            return {};
        }
        return {
            field: this.sortField,
            option: this.sortOption,
        };
    }

    // Lấy payload hoàn chỉnh
    getPayload() {
        return {
            page_index: 1,
            page_size: 20,
            filter_rules: [],
            search_rule: this.getSearchRule(),
            sort_rule: this.getSortRule(),
        };
    }

    onSearchChange(): void {
        this.searchInputChanged.next(this.searchValue);
    }

    // Lấy các rule tìm kiếm
    getSearchRule(): any {
        const defaultSearchFields = {
            fields: ['data__full_name', 'data__email', 'data__phone_number'],
            option: 'contains',
            value: this.searchValue.trim(),
        };

        return this.searchValue?.trim() ? defaultSearchFields : {};
    }

    onStatusChange(customer: any) {
        // Tạo một bản sao đầy đủ của customer.data
        const updatedData = { ...customer.data };

        // Chỉ cập nhật status
        updatedData.status = this.dataRecord.status;

        this._customerService
            .updateCustomer(customer.id, updatedData)
            .subscribe({
                next: (res) => {},
                error: (err) => {},
            });
    }

    // Hàm xử lý field value từ record_data
    populateValuesFromCustomer(): void {
        if (!this.selectedCustomerId || !this.formJson) return;

        for (const section of this.formJson) {
            for (const field of section.fields) {
                const key = field.name;
                const fieldType = field.type;

                // Gán value từ record_data nếu key tồn tại
                if (this.selectedCustomerId.hasOwnProperty(key)) {
                    const rawValue = this.selectedCustomerId[key];

                    // Xử lý theo loại field
                    switch (fieldType) {
                        case 'date':
                        case 'datetime-local':
                            field.value = rawValue ? new Date(rawValue) : null;
                            break;

                        case 'select':
                            // Nếu là foreign key, rawValue có thể là ID hoặc object
                            field.value = rawValue; // hoặc map lại nếu cần
                            break;

                        default:
                            field.value = rawValue;
                    }
                }

                // Thêm xử lý đặc biệt nếu label là ngày tạo/cập nhật
                if (field.label === 'Ngày khởi tạo') {
                    field.value = new Date(
                        this.selectedCustomerId['created_at']
                    );
                }

                if (field.label === 'Ngày cập nhật') {
                    field.value = new Date(
                        this.selectedCustomerId['updated_at']
                    );
                }

                if (field.label === 'Người phụ trách') {
                    field.value = this.selectedCustomerId['assigned_by'];
                }
            }
        }
    }

    // Chọn customer cột 1
    selectCustomer(id: number): void {
        this.selectedCustomerId = id;
        this._router.navigate(['/user/customer', id]);
        this.loadCustomerDetail(id);
    }

    // Hàm xử lý quay lại trang list
    goBack(): void {
        this._router.navigate(['user/customer']);
    }

    // Pipe value
    getFormattedValue(field: any): string {
        if (!field?.value) return ''; // ⬅️ Trả chuỗi rỗng nếu không có value

        if (field.type === 'date') {
            const date = new Date(field.value);
            // Trả về yyyy-MM-dd để input[type=date] hiểu đúng
            return date.toISOString().split('T')[0];
        }

        if (
            field.label === 'Ngày khởi tạo' ||
            field.label === 'Ngày cập nhật'
        ) {
            return new Date(field.value).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        if (field.name === 'assigned_by') {
            return this.dataRecord.assigned || '';
        }

        if (field.name === 'source_name') {
            return this.dataRecord.source || '';
        }
        return field.value;
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

    initLocationOptions() {
        // Lấy danh sách quận dựa vào tỉnh đã có
        this.districtOptions =
            this.cityOptions.find(
                (p) => p.id === this.dataRecord.address_provinces_name
            )?.districts || [];

        // Lấy danh sách phường dựa vào quận đã có
        this.wardOptions =
            this.districtOptions.find(
                (d) => d.id === this.dataRecord.address_districts_name
            )?.wards || [];
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
            search_rule: this.getSearchRule(),
            sort_rule: this.getSortRule(),
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

    // Xử lý form
    initDynamicForm(dataForm: any[]): void {
        const group: any = {};

        this.formJson.forEach((section) => {
            section.fields.forEach((field) => {
                const validators = [];

                if (field.required) validators.push(Validators.required);
                if (field.config?.max_length) {
                    validators.push(
                        Validators.maxLength(field.config.max_length)
                    );
                }
                if (field.name.toLowerCase().includes('email')) {
                    validators.push(AuthUtils.emailValidator);
                }
                if (field.name.toLowerCase().includes('phone')) {
                    validators.push(Validators.pattern(/^0\d{9}$/));
                }
                if (
                    field.name.toLowerCase().includes('birth') ||
                    field.name.toLowerCase().includes('date')
                ) {
                    validators.push(maxDateValidator(this.today));
                }
                if (field.name === 'source_name') {
                    group['source'] = new FormControl(
                        this.dataRecord.source || ''
                    );
                }

                if (field.name === 'assigned_by') {
                    group['assigned'] = new FormControl(
                        this.dataRecord.assigned || ''
                    );
                }

                let value = field.value || '';

                if (field.type === 'date' && field.value) {
                    const date = new Date(field.value);
                    const dateOnly = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                    );
                    value = dateOnly;
                }

                group[field.name] = new FormControl(value, validators);

                field.value = value;
            });
        });

        group['status'] = new FormControl(this.dataRecord.status || '', []);

        this.dynamicForm = this.fb.group(group);
    }

    // Update API
    onSubmit(): void {
        if (this.dynamicForm.valid) {
            const payload = {
                ...this.dynamicForm.value,
            };
            console.log('Submit form value:', payload);

            this._customerService.updateCustomer(this.id, payload).subscribe({
                next: (res) => {
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: 'Cập nhật thành công!',
                        type: 'success',
                    });

                    this._router.navigate([
                        `/${routeConfig.ROUTER_USER}/${routeConfig.CUSTOMER_LIST}`,
                    ]);

                    this.dynamicForm.reset();
                    this.dynamicForm.enable();
                },
                error: (err) => {
                    const errors = err?.error?.errors;
                    this.alert = { type: 'error', code: [] };

                    if (
                        err?.error?.code === 'VALIDATION_ERROR' &&
                        Array.isArray(errors)
                    ) {
                        this.alert.code = errors.map(
                            (e: any) => `errors.fields.${e.field}`
                        );
                    } else {
                        this.alert.code = [
                            `errors.${err?.error?.code}` || 'errors.default',
                        ];
                    }

                    this.dynamicForm.enable();
                    this.showAlert = true;
                },
            });
        }
    }

    // Hàm xử lý click vào dropdown liên hệ
    toggleContactDropdown() {
        this.isContactOpen = !this.isContactOpen;
    }

    // Data mẫu cho dropdown liên hệ
    relatedContacts = [
        {
            name: 'Anh Vũ Đức',
            email: 'anhvuduct@gmail.com',
            phone: '0868179491',
        },
        {
            name: 'Nguyễn Thị Cẩm',
            email: 'camnguyen@gmail.com',
            phone: '0912345678',
        },
        {
            name: 'Trần Văn A',
            email: 'tranvana@gmail.com',
            phone: '0899999999',
        },
        {
            name: 'Phạm Thị B',
            email: 'phamthib@gmail.com',
            phone: '0877777777',
        },
        { name: 'Lê Văn C', email: 'levanc@gmail.com', phone: '0866666666' },
        { name: 'Ngô Thị D', email: 'ngothid@gmail.com', phone: '0855555555' },
        { name: 'Ngô Thị D', email: 'ngothid@gmail.com', phone: '0855555555' },
        { name: 'Ngô Thị D', email: 'ngothid@gmail.com', phone: '0855555555' },
        { name: 'Ngô Thị D', email: 'ngothid@gmail.com', phone: '0855555555' },
        { name: 'Ngô Thị D', email: 'ngothid@gmail.com', phone: '0855555555' },
    ];

    // Hàm xử lý click vào dropdown công ty
    toggleCompanyDropdown() {
        this.isCompanyOpen = !this.isCompanyOpen;
    }

    // Data mẫu cho dropdown công ty
    relatedCompanies = [
        { name: 'Công ty ABC', email: 'abc@company.com', phone: '0901234567' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
        { name: 'Công ty XYZ', email: 'xyz@company.com', phone: '0987654321' },
    ];

    isOpen = false;
    selectedActionValue: number = 0;
    selectedActionName: string;
    actions = [
        { value: 1, name: 'Thêm liên hệ liên quan' },
        { value: 2, name: 'Thêm công ty liên quan' },
        { value: 3, name: 'Thêm báo giá' },
        { value: 4, name: 'Thêm đơn hàng' },
    ];

    @ViewChild('dropdownWrapper') dropdownWrapper!: ElementRef;

    toggleDropdown(event: MouseEvent) {
        event.stopPropagation(); // Không cho click lan ra document
        this.isOpen = !this.isOpen;
    }

    onActionSelect(action: { value: number; name: string }) {
        this.isOpen = false;
        this.selectedActionValue = action.value;
        this.selectedActionName = action.name;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (
            this.dropdownWrapper &&
            !this.dropdownWrapper.nativeElement.contains(event.target)
        ) {
            this.isOpen = false;
        }
    }

    selectedSortOption: string = 'default'; // mặc định
    sortOptions = [
        { label: 'Mặc định', value: 'default' },
        { label: 'Tên khách hàng', value: 'data__full_name' },
        { label: 'Email', value: 'data__email' },
        { label: 'Số điện thoại', value: 'data__phone_number' },
        { label: 'Người phụ trách', value: 'data__assigned_by' },
        { label: 'Nguồn', value: 'data__source_name' },
    ];

    onSortOptionChange() {
        if (this.selectedSortOption === 'default') {
            this.sortField = 'data__full_name';
        } else {
            this.sortField = this.selectedSortOption;
        }
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
