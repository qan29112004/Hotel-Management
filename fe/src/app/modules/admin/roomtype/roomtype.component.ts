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
import { RoomType } from 'app/core/admin/roomtype/roomtype.types';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
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
import { RoomtypeService } from 'app/core/admin/roomtype/roomtype.service';
import { AmenityService } from 'app/core/admin/amenity/amenity.service';
import { MarkdownComponent } from 'ngx-markdown';
@Component({
  selector: 'app-roomtype',
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
    MatTooltipModule,
    MarkdownComponent
  ],
  templateUrl: './roomtype.component.html',
  styles: ``
})
export class RoomTypeComponent {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  room_types: RoomType[] = [];
  user:User;
  selectedRoomType:RoomType = null;
  selectedIds: string[] = [];
  hasSelectedRoomType:boolean= false;
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
  showAddRoomType: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 

  optionsHotel:any = [];
  radioAmenityOptions:any = [];

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
        labelKey: 'room_type.name',
        type: 'text',
        placeholderKey: 'room_type.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'room_type.description',
        type: 'textarea',
        placeholderKey: 'room_type.enterDescription',
        required: true,
        
    },
    
    {
        name: 'maxOccupancy',
        labelKey: 'room_type.max_occupancy',
        type: 'number',
        placeholderKey: 'room_type.enterPhone',
        required: true,
        
    },
    {
        name: 'totalRooms',
        labelKey: 'room_type.total_rooms',
        type: 'number',
        placeholderKey: 'room_type.enterTotalRooms',
        required: true,
        
    },
    {
        name: 'thumbnail',
        labelKey: 'room_type.thumbnail',
        type: 'file',
        placeholderKey: 'room_type.enterThumbnail',
        accept: 'image/*',
    },
    {
        name: 'images',
        labelKey: 'room_type.images',
        type: 'files',
        placeholderKey: 'room_type.enterImages',
        accept: 'image/*',
    },
    {
        name: 'hotelId',
        labelKey: 'room_type.hotel',
        type: 'select',
        placeholderKey: 'room_type.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
        name: 'basePrice',
        labelKey: 'room_type.price',
        type: 'text',
        placeholderKey: 'room_type.enterPrice',
        
        
    },
    {
        name: 'size',
        labelKey: 'room_type.size',
        type: 'text',
        placeholderKey: 'room_type.enterSize',
        
        
    },
    {
        name: 'amenity',
        labelKey: 'room_type.amenity',
        type: 'checkbox',
        placeholderKey: 'room_type.enterAmenity',
        relatedName:"roomtype_amenity__uuid",
        asyncOptionsKey: true,
    },
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'room_type.name',
        type: 'text',
        placeholderKey: 'room_type.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'room_type.description',
        type: 'textarea',
        placeholderKey: 'room_type.enterDescription',
        required: true,
        
    },
    
    {
        name: 'max_occupancy',
        labelKey: 'room_type.max_occupancy',
        type: 'number',
        placeholderKey: 'room_type.enterPhone',
        required: true,
        
    },
    {
        name: 'total_rooms',
        labelKey: 'room_type.total_rooms',
        type: 'number',
        placeholderKey: 'room_type.enterTotalRooms',
        required: true,
        
    },
    {
        name: 'thumbnail',
        labelKey: 'room_type.thumbnail',
        type: 'file',
        placeholderKey: 'room_type.enterThumbnail',
        accept: 'image/*',
    },
    {
        name: 'images',
        labelKey: 'room_type.images',
        type: 'files',
        placeholderKey: 'room_type.enterImages',
        accept: 'image/*',
    },
    {
        name: 'hotel_id',
        labelKey: 'room_type.hotel',
        type: 'select',
        placeholderKey: 'room_type.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    },
    {
        name: 'price',
        labelKey: 'room_type.price',
        type: 'text',
        placeholderKey: 'room_type.enterPrice',
        
        
    },
    {
        name: 'size',
        labelKey: 'room_type.size',
        type: 'text',
        placeholderKey: 'room_type.enterSize',
        
        
    },
    {
        name: 'amenity',
        labelKey: 'room_type.amenity',
        type: 'checkbox',
        placeholderKey: 'room_type.enterAmenity',
        relatedName:"roomtype_amenity__uuid",
        asyncOptionsKey: true,
    },
  ]

  filterFields: FieldFilterConfig[] =[
    {
        name: 'name',
        labelKey: 'room_type.name',
        type: 'text',
        placeholderKey: 'room_type.enterFullName',
        autocompleteOptions: [],
    },
    {
        name: 'status',
        labelKey: 'room_type.status',
        type: 'select',
        options: [
            { id: 'Active', name: 'Active' },
            { id: 'Inactive', name: 'Inactive' }
        ],
        placeholderKey: 'room_type.selectStatus',
    },
    {
        name: 'hotel_id',
        labelKey: 'room_type.name',
        type: 'select',
        placeholderKey: 'room_type.enterFullName',
        asyncOptionsKey: true,
        isForeingKey:true
    },
    {
        name: 'amenity',
        labelKey: 'room_type.description',
        type: 'checkbox',
        placeholderKey: 'room_type.enterDescription',
        relatedName:"roomtype_amenity__amenity__uuid",
        asyncOptionsKey: true,
    },
  ]

  constructor(
      public translocoService: TranslocoService,
      private _alertService: AlertService,
      private roomTypeService: RoomtypeService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private datePipe: DatePipe,
      private userService: UserService,
      private hotelService: HotelService,
      private amenityService: AmenityService
    ) {}
  
  ngOnInit(): void {
      this.loadRoomTypes();
      if(this.amenityService.check.length > 0){
        this.amenityService.amenity$.pipe(
          map(amenities => {
    
            if (amenities) {
              return amenities.map(amenity => ({
                id: amenity.uuid,
                name: amenity.name,
                icon: amenity.icon
              }));
            }
            return []; 
          }
          ),
        takeUntil(this._unsubscribeAll)
        ).subscribe(option=>{
          this.radioAmenityOptions = option;
        })
      }else{
        this.amenityService.getAllAmenities({page_size:0}).pipe(
          map(amenities => {
    
            if (amenities) {
              return amenities.data.map(amenity => ({
                id: amenity.uuid,
                name: amenity.name,
                icon: amenity.icon
              }));
            }
            return []; 
          }
          ),
        takeUntil(this._unsubscribeAll)
        ).subscribe((options)=>{
          this.radioAmenityOptions = options;
          console.log("amenity options:", options)
        });
      }
      this.hotelService.getAllHotels({page_size:0}).pipe(
        map(destinations => {
  
          if (destinations) {
            return destinations.data.map(dest => ({
              id: dest.uuid,
              name: dest.name
            }));
          }
          return []; 
        }
        ),
      takeUntil(this._unsubscribeAll)
      ).subscribe((options)=>{
        this.optionsHotel = options;
        console.log("destination options:", this.optionsHotel)
      });
      this.userService.user$.subscribe((user)=>{
        this.user = user;
      })
      console.log(this.showFilter)
    }
  
    loadRoomTypes(): void {
      this.loading = true;
      const payload = this.getPayload();
  
      this.roomTypeService.getRoomTypes(payload).subscribe({
        next: (response) => {
          console.log("destination res:",response)
          this.room_types = response.data || [];
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
    //     this.room_typeService.getRoomTypes({ page_index: 1, page_size: 1000 }).subscribe({
    //         next: (response) => {
    //             const nameField = this.filterFields.find(f => f.name === 'name');
    //             if (nameField) {
    //                 nameField.autocompleteOptions = response.data.map((room_type: RoomType) => room_type.name);
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
        this.loadRoomTypes();
    }
  
    onResetFilter(): void {
        this.externalFilters = {};
        this.currentPage = 1;
        this.loadRoomTypes();
    }
  
    onPageChange(page: number): void {
      this.currentPage = page;
      this.loadRoomTypes();
    }
  
    onSearch(): void {
      this.currentPage = 1;
      this.loadRoomTypes();
    }
  
    clearSearch(): void {
      this.searchTerm = '';
      this.currentPage = 1;
      this.loadRoomTypes();
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
      this.loadRoomTypes();
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
    async toggleEditUserDrawer(room_type?: RoomType) {
        if (room_type) {
          this.selectedRoomType=room_type;
          console.log("selected room_type", this.selectedRoomType);
        }
        this.showEditUser = !this.showEditUser;
        if (this.showEditUser) {
          // ✅ Lazy import component chỉ khi cần
          const { GenericEditComponent } = await import('app/shared/components/generic-components');
          const componentRef = this.editContainer.createComponent(GenericEditComponent);
  
          // ✅ Truyền Input cho component
          componentRef.instance.showDrawer = true;
          componentRef.instance.titleKey = 'room_type.detail';
          componentRef.instance.fields = this.fields;
          componentRef.instance.entityData = this.selectedRoomType;
          componentRef.instance.saveHandler = this.saveHandler.bind(this);
          componentRef.instance.loadData = this.loadRoomTypes.bind(this);
          componentRef.instance.optionDestination = this.optionsHotel;
          componentRef.instance.optionRadio = this.radioAmenityOptions;
  
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
      this.showAddRoomType = !this.showAddRoomType
    }
  
    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.loadRoomTypes();
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
      this.showAddRoomType = opened;
    }
    saveHandler(payload: any): Observable<any> {
      return this.roomTypeService.updateRoomType(payload.get('uuid'), payload);
    }
  
    addSaveHandler(payload: any): Observable<any> {
      return this.roomTypeService.createRoomType(payload);
    }
    deleteHandler(id: string): Observable<any> {
      this.selectedIds=[]
      return this.roomTypeService.deleteRoomType(id);
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
          this.room_types.forEach((room_type) => (room_type.selected = checked));
          this.toggleRow();
    }
  
    toggleRow(): void {
      this.selectedIds = this.room_types
              .filter((user) => user.selected)
              .map((user) => user.uuid);
      this.hasSelectedRoomType = this.selectedIds.length >= 1;
    }

    ngOnDestroy(): void {
      // Huỷ tất cả các subscription khi component bị huỷ
      this._unsubscribeAll.next(null);
      this._unsubscribeAll.complete();
    }
}
