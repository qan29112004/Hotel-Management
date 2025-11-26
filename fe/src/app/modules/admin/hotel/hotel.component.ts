import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { FormsModule } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Component, ElementRef, OnInit, ComponentFactoryResolver, ViewContainerRef, ViewChild } from '@angular/core';
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
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { Hotel } from 'app/core/admin/hotel/hotel.types';
import { SharedModule } from 'app/shared/shared.module';
import { GenericEditComponent } from 'app/shared/components/generic-components';
import { GenericAddComponent } from 'app/shared/components/generic-components';
import { GenericFilterComponent, FieldFilterConfig } from 'app/shared/components/generic-components';
import { GenericDeleteComponent } from 'app/shared/components/generic-components';
import { FieldConfig } from 'app/core/admin/destination/destination.type';
import { map, Observable, takeUntil } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { ServiceService } from 'app/core/admin/service/service.service';

@Component({
  selector: 'app-hotel',
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
  templateUrl: './hotel.component.html',
  styles: ``
})
export class HotelComponent {
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  hotels: Hotel[] = [];
  user:User;
  selectedHotel:Hotel = null;
  selectedIds: string[] = [];
  hasSelectedHotel:boolean= false;
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
  showAddHotel: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 

  optionsDestination:any = [];
  checkboxService:any = [];

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
        labelKey: 'hotel.name',
        type: 'text',
        placeholderKey: 'destination.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'hotel.description',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        
    },
    
    {
        name: 'phone',
        labelKey: 'hotel.enterPhone',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        
    },
    {
        name: 'address',
        labelKey: 'hotel.enterAddress',
        type: 'text',
        placeholderKey: 'destination.enterAddress',
        required: true,
        
    },
    {
        name: 'status',
        labelKey: 'hotel.status',
        type: 'select',
        options: [
            { id: 'Active', name: 'Active' },
            { id: 'Inactive', name: 'Inactive' }
        ],
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'thumbnail',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'destination.enterdDescription',
        accept: 'image/*',
    },
    {
        name: 'images',
        labelKey: 'hotel.images',
        type: 'files',
        placeholderKey: 'destination.enterdDescription',
        accept: 'image/*',
    },
    {
        name: 'destination',
        labelKey: 'destination.name',
        type: 'select',
        placeholderKey: 'destination.enterFullName',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
        name: 'latitude',
        labelKey: 'destination.description',
        type: 'number',
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'longitude',
        labelKey: 'destination.description',
        type: 'number',
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'service',
        labelKey: 'hotel.service',
        type: 'checkbox',
        placeholderKey: 'hotel.enterService',
        relatedName:"hotel_services__service__uuid",
        asyncOptionsKey: true,
    },
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'hotel.name',
        type: 'text',
        placeholderKey: 'destination.enterFullName',
        required: true,
        errorMessages: {
            required: 'hotel.requiredName',
        }
        
    },
    {
        name: 'description',
        labelKey: 'hotel.description',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        errorMessages: {
            required: 'hotel.requiredDescription',
        }
    },
    
    {
        name: 'phone',
        labelKey: 'hotel.enterPhone',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        errorMessages: {
            required: 'hotel.requiredPhone',
        }
    },
    {
        name: 'address',
        labelKey: 'hotel.enterAddress',
        type: 'text',
        placeholderKey: 'destination.enterAddress',
        required: true,
        
    },
    {
        name: 'status',
        labelKey: 'hotel.status',
        type: 'select',
        options: [
            { id: 'Live', name: 'Live' },
            { id: 'Draft', name: 'Draft' },
            { id: 'Rejected', name: 'Rejected' },
            { id: 'Disabled', name: 'Disabled' },
            { id: 'In Preview', name: 'In Preview' },
        ],
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'thumbnail',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'hotel.chooseThumbnail',
        accept: 'image/*',
    },
    {
        name: 'images',
        labelKey: 'hotel.images',
        type: 'files',
        placeholderKey: 'hotel.chooseImages',
        accept: 'image/*',
    },
    {
        name: 'destination',
        labelKey: 'destination.name',
        type: 'select',
        placeholderKey: 'destination.enterFullName',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
        name: 'latitude',
        labelKey: 'destination.description',
        type: 'number',
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'longitude',
        labelKey: 'destination.description',
        type: 'number',
        placeholderKey: 'destination.enterdDescription',
        
        
    },
    {
        name: 'service',
        labelKey: 'hotel.service',
        type: 'checkbox',
        placeholderKey: 'hotel.enterService',
        relatedName:"hotel_services__service__uuid",
        asyncOptionsKey: true,
    },
  ]

  filterFields: FieldFilterConfig[] =[
    {
        name: 'name',
        labelKey: 'hotel.name',
        type: 'text',
        placeholderKey: 'hotel.enterFullName',
        autocompleteOptions: [],
    },
    {
        name: 'status',
        labelKey: 'hotel.status',
        type: 'select',
        options: [
            { id: 'Live', name: 'Live' },
            { id: 'Draft', name: 'Draft' },
            { id: 'Rejected', name: 'Rejected' },
            { id: 'Disabled', name: 'Disabled' },
            { id: 'In Preview', name: 'In Preview' },
        ],
        placeholderKey: 'hotel.selectStatus',
    },
    {
        name: 'destination',
        labelKey: 'destination.description',
        type: 'select',
        placeholderKey: 'destination.enterdDescription',
        asyncOptionsKey: true,
        isForeingKey:true
        
    },
    {
        name: 'service',
        labelKey: 'hotel.service',
        type: 'checkbox',
        placeholderKey: 'hotel.enterService',
        relatedName:"hotel_services__service__uuid",
        asyncOptionsKey: true,
    },
  ]

  constructor(
      public translocoService: TranslocoService,
      private _alertService: AlertService,
      private hotelService: HotelService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private datePipe: DatePipe,
      private userService: UserService,
      private destinationService: DestinationService,
      private serviceService:ServiceService
    ) {}

  ngOnInit(): void {
    this.loadHotels();
    this.loadAllService();
    this.destinationService.getDestinations().pipe(
      map(destinations => {

        if (destinations) {
          return destinations.data.map(dest => ({
            id: dest.uuid,
            name: dest.name
          }));
        }
        return []; 
      }
      )
    ).subscribe((options)=>{
      this.optionsDestination = options;
      console.log("destination options:", this.optionsDestination)
    });
    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }

  loadAllService(){
      this.serviceService.getAllService({page_size:0}).pipe(
        map(services=>{
          if(services){
            return services.data
            .filter(service => service.type === 'Paid' ||service.type === 'Add on' )
            .map(service=>({
              id: service.uuid,
              name:service.name,
              icon:service.image
            }))
          }
          return [];
        }),
      ).subscribe(option=>{
        this.checkboxService=option
      })
    
  }

  loadHotels(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.hotelService.getHotels(payload).subscribe({
      next: (response) => {
        console.log("destination res:",response)
        this.hotels = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load destinations',
          type: 'error'
        });
        console.error('Error loading destinations:', error);
      }
    });
  }

  // loadAutocompleteOptions(): void {
  //     // Cập nhật autocomplete options cho trường name
  //     this.hotelService.getHotels({ page_index: 1, page_size: 1000 }).subscribe({
  //         next: (response) => {
  //             const nameField = this.filterFields.find(f => f.name === 'name');
  //             if (nameField) {
  //                 nameField.autocompleteOptions = response.data.map((hotel: Hotel) => hotel.name);
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
      this.loadHotels();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadHotels();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadHotels();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadHotels();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadHotels();
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
    this.loadHotels();
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
  async toggleEditUserDrawer(hotel?: Hotel) {
      if (hotel) {
        this.selectedHotel=hotel;
        console.log("selected hotel", this.selectedHotel);
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'hotel.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedHotel;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadHotels.bind(this);
        componentRef.instance.optionDestination = this.optionsDestination;
        componentRef.instance.optionRadio = this.checkboxService;

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
    this.showAddHotel = !this.showAddHotel
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadHotels();
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
    this.showAddHotel = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.hotelService.updateHotel(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.hotelService.createHotel(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.hotelService.deleteHotel(id);
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
        this.hotels.forEach((hotel) => (hotel.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.hotels
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedHotel = this.selectedIds.length >= 1;
  }

  
}
