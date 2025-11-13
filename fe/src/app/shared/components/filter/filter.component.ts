import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    OnDestroy,
    OnInit,
    Output,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    ViewEncapsulation,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { CustomerService } from 'app/core/user/customer/customer.service';
import { SharedModule } from 'app/shared/shared.module';
import { debounceTime, Subject, takeUntil, tap } from 'rxjs';

@Component({
    selector: 'filter',
    templateUrl: './filter.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'filter',
    standalone: true,
    imports: [CommonModule, SharedModule],
})
export class FilterComponent implements OnInit, OnDestroy {
    @ViewChild('filtersOrigin') private _filtersOrigin: MatButton;
    @ViewChild('filtersPanel') private _filtersPanel: TemplateRef<any>;
    @Output() submitFilter = new EventEmitter<any>();

    filterForm!: UntypedFormGroup;
    private _overlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    cityOptions: any[] = [];
    districtOptions: any[] = [];
    wardOptions: any[] = [];
    AssignedByOptions: any;
    sourceOptions: any[] = [];
    statusOptions = [
        { name: 'Khách hàng mới', id: 'khach_hang_moi' },
        { name: 'Tiềm năng', id: 'tiem_nang' },
        { name: 'Cơ hội', id: 'co_hoi' },
        { name: 'Chính thức', id: 'chinh_thuc' },
        { name: 'Rời bỏ', id: 'roi_bo' },
    ];

    /**
     * Constructor
     */
    constructor(
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _formBuilder: UntypedFormBuilder,
        private _customerService: CustomerService,
        private _userManagementService: UserManagementService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.filterForm = this._formBuilder.group({
            status: [[]],
            assigned_by: [[]],
            department: [[]], // Multi-select
            address_provinces_name: [[]], // Multi-select
            address_districts_name: [[]], // Multi-select
            address_wards_name: [[]], // Multi-select
            created_at: [[]],
            updated_at: [[]],
            source_name: [[]],
        });
        this._customerService.filterForm = this.filterForm;

        this.loadData();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Dispose the overlay
        if (this._overlayRef) {
            this._overlayRef.dispose();
        }
    }

    loadData(): void {
        this.getCity();
        this.getDistricts();
        this.getWards();
        this.getAssignedBy();
        this.getSource();
    }
    getWards() {
        this.filterForm
            .get('address_districts_name')
            ?.valueChanges.subscribe((selectedDistricts) => {
                this.wardOptions = [];

                // Gộp tất cả wards từ các huyện đã chọn
                selectedDistricts.forEach((district: any) => {
                    if (Array.isArray(district.wards)) {
                        this.wardOptions.push(...district.wards);
                    }
                });

                // Xoá trùng theo id
                this.wardOptions = this.wardOptions.filter(
                    (v, i, a) => a.findIndex((t) => t.id === v.id) === i
                );

                // Giữ lại những xã hợp lệ đã chọn (nếu có)
                const currentWards =
                    this.filterForm.get('address_wards_name')?.value || [];
                const validWards = currentWards.filter((w: any) =>
                    this.wardOptions.some((fw) => fw.id === w.id)
                );
                this.filterForm.get('address_wards_name')?.setValue(validWards);
            });
    }

    getDistricts() {
        this.filterForm
            .get('address_provinces_name')
            ?.valueChanges.subscribe((selectedCities) => {
                this.districtOptions = [];

                const selectedIds = selectedCities.map((c: any) => c.id);

                // Gộp toàn bộ districts từ các city có id nằm trong selectedIds
                for (const city of this.cityOptions) {
                    if (
                        selectedIds.includes(city.id) &&
                        Array.isArray(city.districts)
                    ) {
                        this.districtOptions.push(...city.districts);
                    }
                }

                // Xóa trùng theo id
                this.districtOptions = this.districtOptions.filter(
                    (v, i, a) => a.findIndex((t) => t.id === v.id) === i
                );

                // Giữ lại những huyện hợp lệ đã chọn (nếu có)
                const currentDistricts =
                    this.filterForm.get('address_districts_name')?.value || [];
                const validDistricts = currentDistricts.filter((d: any) =>
                    this.districtOptions.some((fd) => fd.id === d.id)
                );
                this.filterForm
                    .get('address_districts_name')
                    ?.setValue(validDistricts);
            });
    }

    getCity(): void {
        this._customerService.getLocate().subscribe({
            next: (response) => {
                this.cityOptions = response;
                // console.log('City Options:', this.cityOptions);
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
    private mapFilterFields(data: any, fields: string[] = []): any {
        const result: any = { ...data };

        fields.forEach((field) => {
            if (Array.isArray(data[field])) {
                result[field] = data[field].map((item: any) => item.id);
            }
            if (Array.isArray(data[field]) && field === 'status') {
                result[field] = data[field].map((item: any) => item.name);
            }
        });

        return result;
    }

    resetForm() {
        this.filterForm.patchValue({
            status: [],
            assigned_by: [],
            department: [],
            address_provinces_name: [],
            address_districts_name: [],
            address_wards_name: [],
            created_at: [],
            updated_at: [],
            source_name: [],
        });
    }
    resetFilterByKey(key: string) {
        // Reset giá trị trong form
        this.filterForm.patchValue({
            [key]: [],
        });
    }

    onSubmit(): void {
        const rawData = this.filterForm.value;
        this._customerService.filterForm = rawData;

        const cleanedData = this.mapFilterFields(rawData, [
            'status',
            'address_provinces_name',
            'address_districts_name',
            'address_wards_name',
            'assigned_by',
            'source_name',
        ]);
        this.submitFilter.emit(cleanedData);
        this.closePanel();
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Open the messages panel
     */
    openPanel(): void {
        // Return if the messages panel or its origin is not defined
        if (!this._filtersPanel || !this._filtersOrigin) {
            return;
        }

        // Create the overlay if it doesn't exist
        if (!this._overlayRef) {
            this._createOverlay();
        }

        // Attach the portal to the overlay
        this._overlayRef.attach(
            new TemplatePortal(this._filtersPanel, this._viewContainerRef)
        );
    }

    /**
     * Close the messages panel
     */
    closePanel(): void {
        this._overlayRef.detach();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create the overlay
     */
    private _createOverlay(): void {
        // Create the overlay
        this._overlayRef = this._overlay.create({
            hasBackdrop: true,
            backdropClass: 'fuse-backdrop-on-mobile',
            scrollStrategy: this._overlay.scrollStrategies.block(),
            positionStrategy: this._overlay
                .position()
                .flexibleConnectedTo(
                    this._filtersOrigin._elementRef.nativeElement
                )
                .withLockedPosition(true)
                .withPush(true)
                .withPositions([
                    {
                        originX: 'start',
                        originY: 'bottom',
                        overlayX: 'start',
                        overlayY: 'top',
                    },
                    {
                        originX: 'start',
                        originY: 'top',
                        overlayX: 'start',
                        overlayY: 'bottom',
                    },
                    {
                        originX: 'end',
                        originY: 'bottom',
                        overlayX: 'end',
                        overlayY: 'top',
                    },
                    {
                        originX: 'end',
                        originY: 'top',
                        overlayX: 'end',
                        overlayY: 'bottom',
                    },
                ]),
        });

        // Detach the overlay from the portal on backdrop click
        this._overlayRef.backdropClick().subscribe(() => {
            this._overlayRef.detach();
        });
    }
}
