import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SharedModule } from 'app/shared/shared.module';
import { GenericEditComponent } from 'app/shared/components/generic-components';
import { GenericAddComponent } from 'app/shared/components/generic-components';
import { GenericFilterComponent, FieldFilterConfig } from 'app/shared/components/generic-components';
import { GenericDeleteComponent } from 'app/shared/components/generic-components';
import { FieldConfig } from 'app/core/admin/destination/destination.type';
import { debounceTime, Observable, Subject, takeUntil } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { Refund } from 'app/core/admin/refund/refund.types';
import { RefundService } from 'app/core/admin/refund/refund.service';

@Component({
  selector: 'app-refund',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    CustomPaginationComponent,
    GenericEditComponent,
    GenericAddComponent,
    GenericDeleteComponent,
    GenericFilterComponent,
    RouterModule,
    MatIconModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './refund.component.html',
  styles: [`
    /* Custom override to ensure sharp edges on material components if global styles don't cover it */
    :host ::ng-deep .mat-mdc-form-field-flex {
        border-radius: 0 !important;
    }
    :host ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
        border-radius: 0 !important;
    }
  `]
})
export class RefundComponent implements OnInit {
  fields: FieldConfig[] = [
    {
      name: 'uuid',
      labelKey: 'uuid',
      type: 'text',
      required: true,
      disabled: true,
    },
    {
      name: 'transactionId',
      labelKey: 'refund.transaction_id',
      type: 'text',
      placeholderKey: 'refund.enterTransactionId',
      disabled: true,

    },
    {
      name: 'status',
      labelKey: 'refund.status',
      type: 'select',
      options: [
        { id: "Completed", name: "Completed" },
        { id: "Pending", name: "Pending" },
        { id: "Fail", name: "Fail" }
      ],
      placeholderKey: 'refund.enterStatus',
      disabled:true
    },
    {
      name: 'amount',
      labelKey: 'refund.amount',
      type: 'number',
      placeholderKey: 'refund.enterAmount',
      required: true
    },
    {
      name: 'method',
      labelKey: 'refund.method',
      type: 'select',
      options: [
        { id: "PayPal", name: "PayPal" },
        { id: "vnpay", name: "VNPAY" },
      ],
      placeholderKey: 'refund.enterMethod',

    },
    {
      name: 'currency',
      labelKey: 'hotel.currency',
      type: 'text',
      placeholderKey: 'refund.enterCurrency',
      disabled: true
    },

  ]

  addFields: FieldConfig[] = [
    {
      name: 'transaction_id',
      labelKey: 'refund.transaction_id',
      type: 'text',
      placeholderKey: 'refund.enterTransactionId',
      disabled: true
    },
    {
      name: 'status',
      labelKey: 'refund.status',
      type: 'select',
      options: [
        { id: "Completed", name: "Completed" },
        { id: "Pending", name: "Pending" },
        { id: "Fail", name: "Fail" }
      ],
      placeholderKey: 'refund.enterStatus',
      disabled: true
    },
    {
      name: 'amount',
      labelKey: 'refund.amount',
      type: 'number',
      placeholderKey: 'refund.enterAmount',
      required: true,
      disabled: true
    },
    {
      name: 'method',
      labelKey: 'refund.method',
      type: 'select',
      options: [
        { id: "PayPal", name: "PayPal" },
        { id: "vnpay", name: "VNPAY" },
      ],
      placeholderKey: 'refund.enterMethod',
      disabled: true
    },
    {
      name: 'currency',
      labelKey: 'hotel.currency',
      type: 'text',
      placeholderKey: 'refund.enterCurrency',
      disabled: true
    },
  ]

  filterFields: FieldFilterConfig[] = [
    {
      name: 'method',
      labelKey: 'refund.method',
      type: 'select',
      options: [
        { id: "PayPal", name: "PayPal" },
        { id: "vnpay", name: "VNPAY" },
      ],
      placeholderKey: 'refund.enterMethod',
      relatedName:'payment__method'

    },
    {
      name: 'status',
      labelKey: 'refund.status',
      type: 'select',
      options: [
        { id: "Completed", name: "Completed" },
        { id: "Pending", name: "Pending" },
        { id: "Fail", name: "Fail" }
      ],
      placeholderKey: 'refund.enterStatus',

    },
    {
      name: 'created_at',
      labelKey: 'user_management.created_at',
      type: 'date-range',
      rangeFields: { from: 'created_from', to: 'created_to' },
    },
    {
      name: 'updated_at',
      labelKey: 'user_management.updated_at',
      type: 'date-range',
      rangeFields: { from: 'updated_from', to: 'updated_to' },
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user: User
  selectedDes: Refund = null;
  selectedIds: string[] = [];
  refund: Refund[] = [];
  hasSelectedRefund: boolean = false;
  displayedColumns: string[] = ['name', 'description', 'actions'];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  searchTerm = '';
  totalRecords: number = 0;
  totalItems: number = 0;
  selectedStatusIds: number[] = [];
  selectedRoleIds: number[] = [];
  openFilterDropdowns = new Set<string>();
  externalFilters: any = {};
  filterToggleBtnRef!: ElementRef;

  // Sắp xếp
  sortField: string | null = null;
  sortOption: 'asc' | 'desc' | null = null;

  // Show popup
  showEditUser: boolean = false;
  showAddUser: boolean = false;
  showFilter: boolean = false;
  showDeleteDialog: boolean = false;

  private debounceSearch = new Subject<string>();
    private destroy$ = new Subject<any>();

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private refundService: RefundService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadRefunds();
    this.debounceSearchFunc();
    this.userService.user$.subscribe((user) => {
      this.user = user;
    })
  }

  loadRefunds(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.refundService.getAllRefund(payload).subscribe({
      next: (response) => {
        console.log("refund res:", response)
        this.refund = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load refunds',
          type: 'error'
        });
        console.error('Error loading refunds:', error);
      }
    });
  }


  toggleFilterDrawer(): void {
    this.showFilter = !this.showFilter;
  }

  toggleEditFilterDrawer(): void {
    this.showFilter = !this.showFilter;
  }

  onFilterDrawerOpenedChanged(opened: boolean): void {
    this.showFilter = opened;
  }

  onApplyFilter(filterRules: any[]): void {
    this.externalFilters = filterRules;
    this.currentPage = 1;
    this.loadRefunds();
  }

  onResetFilter(): void {
    this.externalFilters = {};
    this.currentPage = 1;
    this.loadRefunds();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRefunds();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.debounceSearch.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRefunds();
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
    this.loadRefunds();
  }
  // Updated payload method to include filters
  getPayload() {
    const filterRules = this.getFilterRule();
    const payload: any = {
      page_index: this.currentPage,
      page_size: this.pageSize,
      search_rule: this.getSearchRule(),
      sort_rule: this.getSortRule(),
    };

    // Add filter rules
    if (Object.keys(filterRules).length > 0) {
      payload.filterRules = filterRules;
    }

    return payload;
  }
  debounceSearchFunc(){
      this.debounceSearch.pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      ).subscribe(value=>{
        this.loadRefunds();
      })
    }
  getSearchRule(): any {
    const defaultSearchFields = {
      fields: ['payment__booking__user_email', 'uuid'],
      option: 'contains',
      value: this.searchTerm.trim(),
    };
    return this.searchTerm?.trim() ? defaultSearchFields : {};
  }
  getFilterRule(): any[] {
    const filters: any[] = [];

    if (this.selectedStatusIds.length > 0) {
      filters.push({
        field: 'status',
        option: 'in',
        value: this.selectedStatusIds,
      });
    }

    if (this.selectedRoleIds.length > 0) {
      filters.push({
        field: 'role',
        option: 'in',
        value: this.selectedRoleIds,
      });
    }

    // filter từ bộ lọc
    if (this.externalFilters && Array.isArray(this.externalFilters)) {
      filters.push(...this.externalFilters);
    }

    return filters;
  }
  getSortRule(): any {
    if (!this.sortField || !this.sortOption) {
      return {};
    }
    return {
      field: this.sortField,
      option: this.sortOption,
    };
  }

  async toggleEditUserDrawer(refund?: Refund) {
    if (refund) {
      this.selectedDes = refund;
    }
    this.showEditUser = !this.showEditUser;
    if (this.showEditUser) {
      // ✅ Lazy import component chỉ khi cần
      const { GenericEditComponent } = await import('app/shared/components/generic-components');
      const componentRef = this.editContainer.createComponent(GenericEditComponent);

      // ✅ Truyền Input cho component
      componentRef.instance.showDrawer = true;
      componentRef.instance.titleKey = 'refund.detail';
      componentRef.instance.fields = this.fields;
      componentRef.instance.entityData = this.selectedDes;
      componentRef.instance.saveHandler = this.saveHandler.bind(this);
      componentRef.instance.loadData = this.loadRefunds.bind(this);

      // ✅ Lắng nghe sự kiện Output
      componentRef.instance.toggleDrawer.subscribe(() => this.toggleEditUserDrawer());
      componentRef.instance.drawerOpenedChanged.subscribe((opened: boolean) => {
        this.showEditUser = opened;
        if (!opened) {
          this.editContainer.clear(); // clear component khi đóng
        }
      });

    } else {
      // ✅ Khi đóng thì xóa component khỏi ViewContainer
      this.editContainer.clear();
    }
  }
  toggleAddUserDrawer() {
    this.showAddUser = !this.showAddUser
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.loadRefunds();
  }
  formatDateTime(dateStr: string): string | null {
    return this.datePipe.transform(dateStr, 'dd/MM/yyyy HH:mm', '+0700');
  }
  formatDateTimeUnix(timestamp: number): string | null {
    const date = new Date(timestamp * 1000); // chuyển từ giây sang mili-giây
    return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm', '+0700');
  }

  onDrawerOpenedChanged(opened: boolean): void {
    this.showEditUser = opened;
  }
  onAddDrawerOpenedChanged(opened: boolean): void {
    this.showAddUser = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.refundService.updateRefund(payload.get('uuid'), payload);
  }

//   addSaveHandler(payload: any): Observable<any> {
//     return this.refundService.createRefund(payload);
//   }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds = []
    this.hasSelectedRefund = false;
    return this.refundService.deleteRefund(id);
  }

  toggleDeleteDialog(uuid?: string): void {
    if (uuid) {
      this.selectedIds = [...this.selectedIds, uuid];
    }
    this.showDeleteDialog = !this.showDeleteDialog;
  }

  toggleAllRows(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.refund.forEach((refund) => (refund.selected = checked));
    this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.refund
      .filter((user) => user.selected)
      .map((user) => user.uuid);
    this.hasSelectedRefund = this.selectedIds.length >= 1;
  }
}