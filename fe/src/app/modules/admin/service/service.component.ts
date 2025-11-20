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
import { map, Observable } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { Service } from 'app/core/admin/service/service.type';
import { ServiceService } from 'app/core/admin/service/service.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';


@Component({
  selector: 'app-service',
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
  templateUrl: './service.component.html',
  styles: ``
})
export class ServiceComponent {
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
        labelKey: 'service.name',
        type: 'text',
        placeholderKey: 'service.enterName',
        required: true,
        
    },
    {
        name: 'image',
        labelKey: 'service.image',
        type: 'file',
        placeholderKey: 'service.enterImage',
        
    },
    {
        name: 'description',
        labelKey: 'service.description',
        type: 'textarea',
        placeholderKey: 'service.enterDescription',
        required: true,
        
    },
    {
        name: 'price',
        labelKey: 'service.price',
        type: 'number',
        placeholderKey: 'service.enterPrice',
        required: true,
        
    },
    {
        name: 'type',
        labelKey: 'service.type',
        type: 'select',
        options:[
          {id:"Include", name:"Include"},
          {id:"Paid", name:"Paid"},
          {id:"Add on", name:"Add on"}
        ],
        placeholderKey: 'service.enterType',
        
        
    },
    
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'service.name',
        type: 'text',
        placeholderKey: 'service.enterName',
        required: true,
        
    },
    {
        name: 'image',
        labelKey: 'service.image',
        type: 'file',
        placeholderKey: 'service.enterImage',
        
    },
    {
        name: 'description',
        labelKey: 'service.description',
        type: 'textarea',
        placeholderKey: 'service.enterDescription',
        required: true,
        
    },
    {
        name: 'price',
        labelKey: 'service.price',
        type: 'number',
        placeholderKey: 'service.enterPrice',
        required: true,
        
    },
    {
        name: 'type',
        labelKey: 'service.type',
        type: 'select',
        options:[
          {id:"Include", name:"Include"},
          {id:"Paid", name:"Paid"},
          {id:"Add on", name:"Add on"}
        ],
        placeholderKey: 'service.enterType',
        
        
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
          name: 'price',
          labelKey: 'service.price',
          type: 'range',
          rangeFields: { from: 'price_from', to: 'price_to' },
      },
      {
        name: 'type',
        labelKey: 'service.type',
        type: 'select',
        options:[
          {id:"Include", name:"Include"},
          {id:"Paid", name:"Paid"},
          {id:"Add on", name:"Add on"}
        ],
        placeholderKey: 'service.enterService'
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Service = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  services: Service[] = [];
  hasSelectedService:boolean= false;
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
  showAddService: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  serviceForm = {
    name: '',
    description: ''
  };
  editingService: Service | null = null;
  showForm = false;

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private serviceService: ServiceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService
  ) {}

  ngOnInit(): void {
    this.loadService();
    this.loadSelectedHotel();

    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
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

  loadService(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.serviceService.getService(payload).subscribe({
      next: (response) => {
        console.log("service res:",response)
        this.services = response.data || [];
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

  loadAutocompleteOptions(): void {
      // Cập nhật autocomplete options cho trường name
      this.serviceService.getService({ page_index: 1, page_size: 1000 }).subscribe({
          next: (response) => {
              const nameField = this.filterFields.find(f => f.name === 'name');
              if (nameField) {
                  nameField.autocompleteOptions = response.data.map((dest: Service) => dest.name);
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
      this.loadService();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadService();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadService();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadService();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadService();
  }

  showCreateForm(): void {
    this.editingService = null;
    this.serviceForm = {
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
      this.loadService();
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
    this.editingService = null;
    this.serviceForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(service?: Service) {
      if (service) {
        this.selectedDes=service;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'service.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadService.bind(this);

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
    this.showAddService = !this.showAddService
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadService();
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
    this.showAddService = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.serviceService.updateService(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.serviceService.createService(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.serviceService.deleteService(id);
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
        this.services.forEach((service) => (service.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.services
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedService = this.selectedIds.length >= 1;
    console.log(this.hasSelectedService)
  }

}
