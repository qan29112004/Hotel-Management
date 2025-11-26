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
import { debounceTime, map, Observable, Subject, takeUntil } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { Voucher } from 'app/core/admin/voucher/voucher.type';
import { VoucherService } from 'app/core/admin/voucher/voucher.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';


@Component({
  selector: 'app-voucher',
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
  templateUrl: './voucher.component.html',
  styles: ``
})
export class VoucherComponent {
  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'code',
        labelKey: 'voucher.code',
        type: 'text',
        placeholderKey: 'voucher.enterCode',
        required: true,
        
    },
    {
        name: 'name',
        labelKey: 'voucher.name',
        type: 'text',
        placeholderKey: 'voucher.entername',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'voucher.description',
        type: 'textarea',
        placeholderKey: 'voucher.enterDescription',
        required: true,
        
    },
    {
        name: 'discountType',
        labelKey: 'voucher.discount_type',
        type: 'select',
        options:[
          {id:'FIXED', name:"Fixed amount"},
          {id:'PERCENT', name:'Percentage'}
        ],
        placeholderKey: 'voucher.enterdiscount_type',
        required: true,
        
    },
    {
        name: 'discountValue',
        labelKey: 'voucher.discount_value',
        type: 'number',
        placeholderKey: 'voucher.enterdiscount_value',
        
        
    },
    {
        name: 'discountPercent',
        labelKey: 'voucher.discount_percent',
        type: 'number',
        placeholderKey: 'voucher.enterdiscount_percent',
        
        
    },
    {
        name: 'maxDiscountAmount',
        labelKey: 'voucher.max_discount_amount',
        type: 'number',
        placeholderKey: 'voucher.entermax_discount_amount',
        
        
    },
    {
        name: 'minOrderValue',
        labelKey: 'voucher.min_order_value',
        type: 'number',
        placeholderKey: 'voucher.entermin_order_value',
        
        
    },
    {
        name: 'startAt',
        labelKey: 'voucher.start_at',
        type: 'date',
        placeholderKey: 'voucher.enterstart_at',
    },
    {
        name: 'expireAt',
        labelKey: 'voucher.expire_at',
        type: 'date',
        placeholderKey: 'voucher.enterexpire_at',
    },
    {
        name: 'relativeExpiryHours',
        labelKey: 'voucher.relative_expiry_hours',
        type: 'number',
        placeholderKey: 'voucher.enterrelative_expiry_hours'
    },
    {
        name: 'maxUsageGlobal',
        labelKey: 'voucher.max_usage_global',
        type: 'number',
        placeholderKey: 'voucher.entermax_usage_global'
    },
    {
        name: 'maxUsagePerUser',
        labelKey: 'voucher.max_usage_per_user',
        type: 'number',
        placeholderKey: 'voucher.entermax_usage_per_user'
    },
    {
        name: 'status',
        labelKey: 'voucher.status',
        type: 'select',
        options:[
          {id:'ACTIVE', name:"Active"},
          {id:'PAUSED', name:'Paused'},
          {id:'EXPIRED', name:'Expired'},
          {id:'EXHAUSTED', name:'Exhausted'}
        ],
        placeholderKey: 'voucher.enterstatus'
    },
    {
        name: 'requiresClaim',
        labelKey: 'voucher.requires_claim',
        type: 'select',
        options:[
          {id:true, name:'True'},
          {id:false, name:'False'}
        ],
        placeholderKey: 'voucher.enterrequires_claim'
    },
    {
        name: 'stackable',
        labelKey: 'voucher.stackable',
        type: 'select',
        options:[
          {id:true, name:'True'},
          {id:false, name:'False'}
        ],
        placeholderKey: 'voucher.enterstackable'
    },
    {
        name: 'totalClaimed',
        labelKey: 'voucher.total_claimed',
        type: 'number',
        placeholderKey: 'voucher.entertotal_claimed'
    },
    {
        name: 'totalUsed',
        labelKey: 'voucher.total_used',
        type: 'number',
        placeholderKey: 'voucher.entertotal_used'
    },
    {
        name: 'hotels',
        labelKey: 'voucher.hotel',
        type: 'checkbox',
        placeholderKey: 'voucher.enterHotel',
        asyncOptionsKey: true
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'code',
        labelKey: 'voucher.code',
        type: 'text',
        placeholderKey: 'voucher.enterCode',
        required: true,
        
    },
    {
        name: 'name',
        labelKey: 'voucher.name',
        type: 'text',
        placeholderKey: 'voucher.entername',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'voucher.description',
        type: 'textarea',
        placeholderKey: 'voucher.enterDescription',
        required: true,
        
    },
    {
        name: 'discount_type',
        labelKey: 'voucher.discount_type',
        type: 'select',
        options:[
          {id:'FIXED', name:"Fixed amount"},
          {id:'PERCENT', name:'Percentage'}
        ],
        placeholderKey: 'voucher.enterdiscount_type',
        required: true,
        
    },
    {
        name: 'discount_value',
        labelKey: 'voucher.discount_value',
        type: 'number',
        placeholderKey: 'voucher.enterdiscount_value',
        
        
    },
    {
        name: 'discount_percent',
        labelKey: 'voucher.discount_percent',
        type: 'number',
        placeholderKey: 'voucher.enterdiscount_percent',
        
        
    },
    {
        name: 'max_discount_amount',
        labelKey: 'voucher.max_discount_amount',
        type: 'number',
        placeholderKey: 'voucher.entermax_discount_amount',
        
        
    },
    {
        name: 'min_order_value',
        labelKey: 'voucher.min_order_value',
        type: 'number',
        placeholderKey: 'voucher.entermin_order_value',
        
        
    },
    {
        name: 'start_at',
        labelKey: 'voucher.start_at',
        type: 'date',
        placeholderKey: 'voucher.enterstart_at',
    },
    {
        name: 'expire_at',
        labelKey: 'voucher.expire_at',
        type: 'date',
        placeholderKey: 'voucher.enterexpire_at',
    },
    {
        name: 'relative_expiry_hours',
        labelKey: 'voucher.relative_expiry_hours',
        type: 'number',
        placeholderKey: 'voucher.enterrelative_expiry_hours'
    },
    {
        name: 'max_usage_global',
        labelKey: 'voucher.max_usage_global',
        type: 'number',
        placeholderKey: 'voucher.entermax_usage_global'
    },
    {
        name: 'max_usage_per_user',
        labelKey: 'voucher.max_usage_per_user',
        type: 'number',
        placeholderKey: 'voucher.entermax_usage_per_user'
    },
    {
        name: 'status',
        labelKey: 'voucher.status',
        type: 'select',
        options:[
          {id:'ACTIVE', name:"Active"},
          {id:'PAUSED', name:'Paused'},
          {id:'EXPIRED', name:'Expired'},
          {id:'EXHAUSTED', name:'Exhausted'}
        ],
        placeholderKey: 'voucher.enterstatus'
    },
    {
        name: 'requires_claim',
        labelKey: 'voucher.requires_claim',
        type: 'select',
        options:[
          {id:true, name:'True'},
          {id:false, name:'False'}
        ],
        placeholderKey: 'voucher.enterrequires_claim'
    },
    {
        name: 'stackable',
        labelKey: 'voucher.stackable',
        type: 'select',
        options:[
          {id:true, name:'True'},
          {id:false, name:'False'}
        ],
        placeholderKey: 'voucher.enterstackable'
    },
    {
        name: 'total_claimed',
        labelKey: 'voucher.total_claimed',
        type: 'number',
        placeholderKey: 'voucher.entertotal_claimed'
    },
    {
        name: 'total_used',
        labelKey: 'voucher.total_used',
        type: 'number',
        placeholderKey: 'voucher.entertotal_used'
    },
    {
        name: 'hotels',
        labelKey: 'voucher.hotel',
        type: 'checkbox',
        placeholderKey: 'voucher.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'requires_claim',
          labelKey: 'voucher.requires_claim',
          type: 'select',
          options:[
            {id:true, name:'True'},
            {id:false, name:'False'}
          ],
          placeholderKey: 'voucher.enterrequires_claim'
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
      {
          name: 'start_at',
          labelKey: 'voucher.start_at',
          type: 'date-range',
          rangeFields: { from: 'start_from', to: 'start_to' },
      },
      {
          name: 'expire_at',
          labelKey: 'voucher.expire_at',
          type: 'date-range',
          rangeFields: { from: 'expire_from', to: 'expire_to' },
      },
      {
        name: 'hotels',
        labelKey: 'voucher.hotel',
        type: 'select',
        placeholderKey: 'voucher.enterHotel',
        asyncOptionsKey: true,
        isForeingKey:true
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Voucher = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  vouchers: Voucher[] = [];
  hasSelectedVoucher:boolean= false;
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
  selectedCreateAt : string = '';
  // Sắp xếp
  sortField: string | null = null;
  sortOption: 'asc' | 'desc' | null = null;


  // Show popup
  showEditUser: boolean = false;
  showAddVoucher: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  voucherForm = {
    name: '',
    description: ''
  };
  editingVoucher: Voucher | null = null;
  showForm = false;

  private debounceSearch = new Subject<string>();
  private destroy$ = new Subject<any>();

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private voucherService: VoucherService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService
  ) {}

  ngOnInit(): void {
    this.loadVoucher();
    this.loadSelectedHotel();
    this.debounceSearchFunc();
    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }

  debounceSearchFunc(){
    this.debounceSearch.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(value=>{
      this.loadVoucher();
    })
  }

  loadSelectedHotel(){
    if(this.hotelService.getHotelData.length > 0){
      this.hotelService.hotel$.pipe(
        map(hotels => {
          
            if (hotels) {
              return hotels.map(dest => ({
                id: dest.uuid,
                name: dest.name,
                icon: dest.thumbnail
              }));
            }
            return []; 
          }
          )
      ).subscribe(hotels=>{
        this.optionsHotel = hotels;
        console.log("optionHotel", this.optionsHotel)
      })
    }else{
      this.hotelService.getAllHotels({"page_size":0}).pipe(
        map(hotels => {
          
            if (hotels) {
              return hotels.data.map(dest => ({
                id: dest.uuid,
                name: dest.name,
                icon: dest.thumbnail
              }));
            }
            return []; 
          }
          )
      ).subscribe(res=>{
        this.optionsHotel = res;
        console.log("optionHotel", this.optionsHotel)
      })
    }
  }

  loadVoucher(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.voucherService.getVoucher(payload).subscribe({
      next: (response) => {
        console.log("voucher res:",response)
        this.vouchers = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load vouchers',
          type: 'error'
        });
        console.error('Error loading vouchers:', error);
      }
    });
  }

  // loadAutocompleteOptions(): void {
  //     // Cập nhật autocomplete options cho trường name
  //     this.voucherService.getVoucher({ page_index: 1, page_size: 1000 }).subscribe({
  //         next: (response) => {
  //             const nameField = this.filterFields.find(f => f.name === 'title');
  //             if (nameField) {
  //                 nameField.autocompleteOptions = response.data.map((dest: Voucher) => dest.title);
  //             }
  //         },
  //         error: (error) => {
  //             console.error('Error loading autocomplete options:', error);
  //         }
  //     });
  // }

  toggleFilterDrawer(): void {
        this.showFilter = !this.showFilter;
    }

  onFilterDrawerOpenedChanged(opened: boolean): void {
      this.showFilter = opened;
  }

  onApplyFilter(filterRules: any[]): void {
      this.externalFilters = filterRules;
      this.currentPage = 1;
      this.loadVoucher();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadVoucher();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadVoucher();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.debounceSearch.next(this.searchTerm)
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadVoucher();
  }

  showCreateForm(): void {
    this.editingVoucher = null;
    this.voucherForm = {
      name: '',
      description: ''
    };
    this.showForm = true;
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
      this.loadVoucher();
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
  getSearchRule(): any {
    const defaultSearchFields = {
        fields: ['name', 'uuid'],
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

  hideForm(): void {
    this.showForm = false;
    this.editingVoucher = null;
    this.voucherForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(voucher?: Voucher) {
      if (voucher) {
        this.selectedDes=voucher;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'voucher.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadVoucher.bind(this);
        componentRef.instance.optionRadio = this.optionsHotel;

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
  toggleAddUserDrawer(){
    this.showAddVoucher = !this.showAddVoucher
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadVoucher();
  }
  formatDateTime(dateStr: string): string | null {
        return this.datePipe.transform(dateStr, 'dd/MM/yyyy HH:mm', '+0700');
  }
  formatDateTimeUnix(timestamp: number): string | null {
      const date = new Date(timestamp * 1000); // chuyển từ giây sang mili-giây
      return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm', '+0700');
  }
  toggleEditFilterDrawer():void{
      this.showFilter = !this.showFilter;
  }
  onDrawerOpenedChanged(opened: boolean): void {
      this.showEditUser = opened;
  }
  onAddDrawerOpenedChanged(opened:boolean):void{
    this.showAddVoucher = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.voucherService.updateVoucher(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.voucherService.createVoucher(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.voucherService.deleteVoucher(id);
  }

  toggleDeleteDialog(uuid?:string): void {
      if (uuid) {
        this.selectedIds = [...this.selectedIds, uuid];
      }
      this.showDeleteDialog = !this.showDeleteDialog;
      console.log("OPEN DELETE DIALOG", this.showDeleteDialog)
  }

  

  toggleAllRows(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
        this.vouchers.forEach((voucher) => (voucher.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.vouchers
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedVoucher = this.selectedIds.length >= 1;
    console.log(this.hasSelectedVoucher)
  }
}
