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
import { Offer } from 'app/core/admin/offer/offer.type';
import { OfferService } from 'app/core/admin/offer/offer.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';


@Component({
  selector: 'app-offer',
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
  templateUrl: './offer.component.html',
  styles: ``
})
export class OfferComponent {
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
        labelKey: 'offer.code',
        type: 'text',
        placeholderKey: 'offer.enterCode',
        required: true,
        
    },
    {
        name: 'title',
        labelKey: 'offer.title',
        type: 'text',
        placeholderKey: 'offer.entertitle',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'offer.description',
        type: 'textarea',
        placeholderKey: 'offer.enterDescription',
        required: true,
        
    },
    {
        name: 'discountPercentage',
        labelKey: 'offer.discount_percentage',
        type: 'number',
        placeholderKey: 'offer.enterdiscount_percentage',
        required: true,
        
    },
    {
        name: 'startDate',
        labelKey: 'offer.start_date',
        type: 'text',
        placeholderKey: 'offer.enterStartDate',
        
        
    },
    {
        name: 'endDate',
        labelKey: 'offer.end_date',
        type: 'text',
        placeholderKey: 'offer.enterEndDate',
        
        
    },
    {
        name: 'isActive',
        labelKey: 'offer.is_active',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false, name:"False"}
        ],
        placeholderKey: 'offer.enterEndDate',
    },
    {
        name: 'amountDays',
        labelKey: 'offer.amount_days',
        type: 'number',
        placeholderKey: 'offer.enterEndDate',
    },
    {
        name: 'images',
        labelKey: 'offer.images',
        type: 'file',
        placeholderKey: 'offer.enterImages',
        accept: 'image/*',
    },
    {
        name: 'hotel',
        labelKey: 'offer.hotel',
        type: 'select',
        placeholderKey: 'offer.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'code',
        labelKey: 'offer.code',
        type: 'text',
        placeholderKey: 'offer.enterCode',
        required: true,
        
    },
    {
        name: 'title',
        labelKey: 'offer.title',
        type: 'text',
        placeholderKey: 'offer.entertitle',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'offer.description',
        type: 'textarea',
        placeholderKey: 'offer.enterDescription',
        required: true,
        
    },
    {
        name: 'discountPercentage',
        labelKey: 'offer.discount_percentage',
        type: 'number',
        placeholderKey: 'offer.enterdiscount_percentage',
        required: true,
        
    },
    {
        name: 'startDate',
        labelKey: 'offer.start_date',
        type: 'text',
        placeholderKey: 'offer.enterStartDate',
        
        
    },
    {
        name: 'endDate',
        labelKey: 'offer.end_date',
        type: 'text',
        placeholderKey: 'offer.enterEndDate',
        
        
    },
    {
        name: 'isActive',
        labelKey: 'offer.is_active',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false, name:"False"}
        ],
        placeholderKey: 'offer.enterEndDate',
    },
    {
        name: 'amountDays',
        labelKey: 'offer.amount_days',
        type: 'number',
        placeholderKey: 'offer.enterEndDate',
    },
    {
        name: 'images',
        labelKey: 'offer.images',
        type: 'file',
        placeholderKey: 'offer.enterImages',
        accept: 'image/*',
    },
    {
        name: 'hotel',
        labelKey: 'offer.hotel',
        type: 'select',
        placeholderKey: 'offer.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'title',
          labelKey: 'offer.title',
          type: 'text',
          placeholderKey: 'offer.enterTitle',
          autocompleteOptions: [], // Sẽ được cập nhật động
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
        name: 'hotel',
        labelKey: 'offer.hotel',
        type: 'select',
        placeholderKey: 'offer.enterHotel',
        asyncOptionsKey: true,
        isForeingKey:true
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Offer = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  offers: Offer[] = [];
  hasSelectedOffer:boolean= false;
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
  showAddOffer: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  offerForm = {
    name: '',
    description: ''
  };
  editingOffer: Offer | null = null;
  showForm = false;

  private debounceSearch = new Subject<string>();
  private destroy$ = new Subject<any>();

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private offerService: OfferService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService
  ) {}

  ngOnInit(): void {
    this.loadOffer();
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
      this.loadOffer();
    })
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
      this.hotelService.getAllHotels({"page_size":0}).pipe(
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

  loadOffer(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.offerService.getOffer(payload).subscribe({
      next: (response) => {
        console.log("offer res:",response)
        this.offers = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load offers',
          type: 'error'
        });
        console.error('Error loading offers:', error);
      }
    });
  }

  loadAutocompleteOptions(): void {
      // Cập nhật autocomplete options cho trường name
      this.offerService.getOffer({ page_index: 1, page_size: 1000 }).subscribe({
          next: (response) => {
              const nameField = this.filterFields.find(f => f.name === 'title');
              if (nameField) {
                  nameField.autocompleteOptions = response.data.map((dest: Offer) => dest.title);
              }
          },
          error: (error) => {
              console.error('Error loading autocomplete options:', error);
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
      this.loadOffer();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadOffer();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadOffer();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.debounceSearch.next(this.searchTerm)
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadOffer();
  }

  showCreateForm(): void {
    this.editingOffer = null;
    this.offerForm = {
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
      this.loadOffer();
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
    this.editingOffer = null;
    this.offerForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(offer?: Offer) {
      if (offer) {
        this.selectedDes=offer;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'offer.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadOffer.bind(this);
        componentRef.instance.optionDestination = this.optionsHotel;

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
    this.showAddOffer = !this.showAddOffer
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadOffer();
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
    this.showAddOffer = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.offerService.updateOffer(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.offerService.createOffer(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.offerService.deleteOffer(id);
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
        this.offers.forEach((offer) => (offer.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.offers
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedOffer = this.selectedIds.length >= 1;
    console.log(this.hasSelectedOffer)
  }
}
