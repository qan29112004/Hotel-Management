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
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { RatePlan } from 'app/core/admin/rateplan/rateplan.type';
import { ServiceService } from 'app/core/admin/service/service.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { RatingService } from 'app/core/admin/rating/rating.service';
import { RateplanService } from 'app/core/admin/rateplan/rateplan.service';

@Component({
  selector: 'app-rateplan',
  standalone: true,
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    CustomPaginationComponent,
    GenericEditComponent,
    GenericAddComponent,
    GenericDeleteComponent,
    GenericFilterComponent
  ],
  templateUrl: './rateplan.component.html',
  styles: ``
})
export class RateplanComponent {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'name',
        labelKey: 'rateplan.name',
        type: 'text',
        placeholderKey: 'rateplan.enterName',
        required: true,
        
    },
    {
        name: 'priceModifier',
        labelKey: 'rateplan.price_modifier',
        type: 'number',
        placeholderKey: 'rateplan.enterPriceModifier',
        
    },
    {
        name: 'description',
        labelKey: 'rateplan.description',
        type: 'textarea',
        placeholderKey: 'rateplan.enterDescription',
        required: true,
        
    },
    {
        name: 'needLogin',
        labelKey: 'rateplan.need_login',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterNeedLogin',
        
    },
    {
        name: 'refundable',
        labelKey: 'rateplan.refundable',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterRefundable',
        
    },
    {
        name: 'isBreakfast',
        labelKey: 'rateplan.is_breakfast',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterIsBreakfast',
        
    },
    {
        name: 'hotel',
        labelKey: 'rateplan.hotel',
        type: 'select',
        placeholderKey: 'rateplan.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
      name: 'guaranteePolicy',
      labelKey: 'rateplan.guarantee_policy',
      type: 'textarea',
      placeholderKey: 'rateplan.enterGuaranteePolicy',
      required: true,
      
    },
    {
      name: 'cancellationPolicy',
      labelKey: 'rateplan.cancellation_policy',
      type: 'textarea',
      placeholderKey: 'rateplan.enterCancellationPolicy',
      required: true,
      
    },
    {
        name: 'service',
        labelKey: 'rateplan.services',
        type: 'checkbox',
        placeholderKey: 'rateplan.enterServices',
        asyncOptionsKey: true,
    },
    
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'rateplan.name',
        type: 'text',
        placeholderKey: 'rateplan.enterName',
        required: true,
        
    },
    {
        name: 'price_modifier',
        labelKey: 'rateplan.price_modifier',
        type: 'number',
        placeholderKey: 'rateplan.enterPriceModifier',
        
    },
    {
        name: 'description',
        labelKey: 'rateplan.description',
        type: 'textarea',
        placeholderKey: 'rateplan.enterDescription',
        required: true,
        
    },
    {
        name: 'need_login',
        labelKey: 'rateplan.need_login',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterNeedLogin',
        
    },
    {
        name: 'refundable',
        labelKey: 'rateplan.refundable',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterRefundable',
        
    },
    {
        name: 'is_breakfast',
        labelKey: 'rateplan.is_breakfast',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rateplan.enterIsBreakfast',
        
    },
    {
        name: 'hotel',
        labelKey: 'rateplan.hotel',
        type: 'select',
        placeholderKey: 'rateplan.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
        name: 'guarantee_policy',
        labelKey: 'rateplan.guarantee_policy',
        type: 'textarea',
        placeholderKey: 'rateplan.enterGuaranteePolicy',
        required: true,
        
    },
    {
        name: 'cancellation_policy',
        labelKey: 'rateplan.cancellation_policy',
        type: 'textarea',
        placeholderKey: 'rateplan.enterCancellationPolicy',
        required: true,
        
    },
    {
        name: 'service',
        labelKey: 'rateplan.services',
        type: 'checkbox',
        placeholderKey: 'rateplan.enterServices',
        asyncOptionsKey: true,
    },
  ]

  filterFields: FieldFilterConfig[] = [
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
          name: 'price_modifier',
          labelKey: 'rateplan.price_modifier',
          type: 'range',
          rangeFields: { from: 'price_from', to: 'price_to' },
      },
      
      {
        name: 'hotel',
        labelKey: 'rateplan.hotel',
        type: 'select',
        placeholderKey: 'rateplan.enterHotel',
        asyncOptionsKey: true,
        isForeingKey:true
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:RatePlan = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  ratePlans: RatePlan[] = [];
  hasSelectedRateplan:boolean= false;
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
  showAddRateplan: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  rateplanForm = {
    name: '',
    description: ''
  };
  editingRateplan: RatePlan | null = null;
  showForm = false;
  checkboxServiceOptions:any = [];

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private ratePlanService: RateplanService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService,
    private serviceService:ServiceService
  ) {}

  ngOnInit(): void {
    this.loadRateplan();
    this.loadSelectedHotel();
    this.loadCheckboxService();

    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }

  loadCheckboxService(){
    if(this.serviceService.check.length>0){
      this.serviceService.service$.pipe(
        map(service=>{
          if (service){
            return service.map(sv=>({
              id : sv.uuid,
              name :sv.name
            }))
          }
          return [];
        }),
        takeUntil(this._unsubscribeAll)
      ).subscribe(service=>{
        this.checkboxServiceOptions = service;
      })
    }else{
      this.serviceService.getAllService({page_size:0}).pipe(
        map(service=>{
          if (service){
            return service.data.map(sv=>({
              id : sv.uuid,
              name :sv.name
            }))
          }
          return [];
        }),
        takeUntil(this._unsubscribeAll)
      ).subscribe(service=>{
        this.checkboxServiceOptions = service;
      })
    }
  }

  loadSelectedHotel(){
    if(this.hotelService.getHotelData.length > 0){
      this.hotelService.hotel$.pipe(
        map(hotels => {
          
            if (hotels) {
              return hotels.map(dest => ({
                id: dest.uuid,
                name: dest.name
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
      this.hotelService.getHotels({"page_size":0}).pipe(
        map(hotels => {
          
            if (hotels) {
              return hotels.data.map(dest => ({
                id: dest.uuid,
                name: dest.name
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

  loadRateplan(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.ratePlanService.getRatePlan(payload).subscribe({
      next: (response) => {
        console.log("rateplan res:",response)
        this.ratePlans = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load services',
          type: 'error'
        });
        console.error('Error loading services:', error);
      }
    });
    
  }


  toggleFilterDrawer(): void {
        this.showFilter = !this.showFilter;
    }

  onFilterDrawerOpenedChanged(opened: boolean): void {
      this.showFilter = opened;
  }

  onApplyFilter(filterRules: any[]): void {
      this.externalFilters = filterRules;
      this.currentPage = 1;
      this.loadRateplan();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadRateplan();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRateplan();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRateplan();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRateplan();
  }

  showCreateForm(): void {
    this.editingRateplan = null;
    this.rateplanForm = {
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
      this.loadRateplan();
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
    this.editingRateplan = null;
    this.rateplanForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(rateplan?: RatePlan) {
      if (rateplan) {
        this.selectedDes=rateplan;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'rateplan.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadRateplan.bind(this);
        componentRef.instance.optionDestination = this.optionsHotel;
        componentRef.instance.optionRadio = this.checkboxServiceOptions;

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
    this.showAddRateplan = !this.showAddRateplan
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadRateplan();
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
    this.showAddRateplan = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.ratePlanService.updateRatePlan(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.ratePlanService.createRatePlan(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.ratePlanService.deleteRatePlan(id);
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
        this.ratePlans.forEach((rateplan) => (rateplan.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.ratePlans
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedRateplan = this.selectedIds.length >= 1;
    console.log(this.hasSelectedRateplan)
  }
}
