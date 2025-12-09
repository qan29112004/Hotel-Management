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
import { Room } from 'app/core/admin/room/room.types';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { SharedModule } from 'app/shared/shared.module';
import { GenericEditComponent } from 'app/shared/components/generic-components';
import { GenericAddComponent } from 'app/shared/components/generic-components';
import { GenericFilterComponent, FieldFilterConfig } from 'app/shared/components/generic-components';
import { GenericDeleteComponent } from 'app/shared/components/generic-components';
import { FieldConfig } from 'app/core/admin/destination/destination.type';
import { map, Observable, Subject, takeUntil, debounceTime } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { RoomtypeService } from 'app/core/admin/roomtype/roomtype.service';
import { AmenityService } from 'app/core/admin/amenity/amenity.service';
import { RoomService } from 'app/core/admin/room/room.service';
@Component({
  selector: 'app-room',
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
  templateUrl: './room.component.html',
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
export class RoomComponent {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  rooms: Room[] = [];
  user:User;
  selectedRoom:Room = null;
  selectedIds: string[] = [];
  hasSelectedRoom:boolean= false;
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
  showAddRoom: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 

  optionsSelect:any = {};
  radioAmenityOptions:any = [];

  private debounceSearch = new Subject<string>();
  private destroy$ = new Subject<any>();

  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'roomNumber',
        labelKey: 'room.room_number',
        type: 'text',
        placeholderKey: 'room.room_number',
        required: true,
        disabled:true
        
    },
    {
        name: 'status',
        labelKey: 'room.status',
        type: 'select',
        placeholderKey: 'room.status',
        options: [
            { id: 'Available', name: 'Available' },
            { id: 'Booked', name: 'Booked' },
            { id: "Maintenance", name:"Maintenance"}
        ],
        required: true,
        
    },
    
    {
        name: 'floor',
        labelKey: 'room.floor',
        type: 'number',
        placeholderKey: 'room.floor',
        required: true,
        
    },
    {
        name: 'housekeepingStatus',
        labelKey: 'room.housekeeping_status',
        type: 'select',
        options: [
            { id: 'Cleaned', name: 'Cleaned' },
            { id: 'Dirty', name: 'Dirty' },
            { id: 'In Progress', name: 'In Progress' }
        ],
        placeholderKey: 'room.housekeeping_status',
    },
    {
        name: 'isLock',
        labelKey: 'room.is_lock',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id: false, name:"False"}
        ],
        placeholderKey: 'room.enterIsLock'
    },
    {
        name: 'roomTypeId',
        labelKey: 'room.room_type',
        type: 'select',
        placeholderKey: 'room.enterRoomType',
        asyncOptionsKey: true,
        isForeignKey:true
    },
  ]

  addFields: FieldConfig[] =[
    {
        name: 'status',
        labelKey: 'room.status',
        type: 'select',
        options: [
          { id: 'Available', name: 'Available' },
          { id: 'Booked', name: 'Booked' },
          { id: "Maintenance", name:"Maintenance"}
      ],
        placeholderKey: 'room.enterStatus',
        
    },
    
    {
        name: 'floor',
        labelKey: 'room.floor',
        type: 'number',
        placeholderKey: 'room.floor',
        required: true,
        
    },
    {
      name: 'is_lock',
      labelKey: 'room.is_lock',
      type: 'select',
      options:[
        {id:true, name:"True"},
        {id: false, name:"False"}
      ],
      placeholderKey: 'room.enterIsLock',
  },
    {
        name: 'room_type_id',
        labelKey: 'room.room_type',
        type: 'select',
        placeholderKey: 'room.enterRoomType',
        asyncOptionsKey: true,
        isForeignKey:true
    },
  ]

  filterFields: FieldFilterConfig[] =[
    
    {
        name: 'floor',
        labelKey: 'room.floor',
        type: 'text',
        placeholderKey: 'room.floor'
        
    },
    {
      name: 'hotels',
      labelKey: 'room.hotel',
      type: 'select',
      placeholderKey: 'room.hotel',
      relatedName:"room_type_id__hotel_id__uuid",
      asyncOptionsKey: true,
        isForeingKey:true
  },
    {
      name: 'is_lock',
      labelKey: 'room.is_lock',
      type: 'select',
      options:[
        {id:true, name:"True"},
        {id: false, name:"False"}
      ],
      placeholderKey: 'room.enterIsLock',
  },
    {
        name: 'housekeeping_status',
        labelKey: 'room.housekeeping_status',
        type: 'select',
        options: [
            { id: 'Cleaned', name: 'Cleaned' },
            { id: 'Dirty', name: 'Dirty' },
            { id: 'In Progress', name: 'In Progress' }
        ],
        placeholderKey: 'room.housekeeping_status',
    },
    {
        name: 'room_type_id',
        labelKey: 'room.room_type',
        type: 'select',
        relatedName:'room_type_id',
        placeholderKey: 'room.enterRoomType',
        asyncOptionsKey: true,
        isForeingKey:true
    },
    {
        name: 'status',
        labelKey: 'room.status',
        type: 'select',
        options: [
            { id: 'Available', name: 'Available' },
            { id: 'Booked', name: 'Booked' },
            { id: "Maintenance", name:"Maintenance"}
        ],
        placeholderKey: 'room.enterStatus',
    },
  ]

  constructor(
      public translocoService: TranslocoService,
      private _alertService: AlertService,
      private roomService: RoomService,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private datePipe: DatePipe,
      private userService: UserService,
      private hotelService: HotelService,
      private amenityService: AmenityService,
      private roomTypeService: RoomtypeService,
    ) {}
  
  ngOnInit(): void {
      this.loadRooms();
      this.loadHotels();
      this.debounceSearch.pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      ).subscribe(value=>{
        this.loadRooms();
      })

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

      this.roomTypeService.getRoomTypes({page_size:0}).pipe(
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
        this.optionsSelect['room_type_id'] = options;
        console.log("check optionsSelect:", this.optionsSelect)
      });
      this.userService.user$.subscribe((user)=>{
        this.user = user;
      })
      console.log(this.showFilter)
    }
  
    loadRooms(): void {
      this.loading = true;
      const payload = this.getPayload();
  
      this.roomService.getRoom(payload).subscribe({
        next: (response) => {
          console.log("destination res:",response)
          this.rooms = response.data || [];
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
    loadHotels(){
      if(this.hotelService.getHotelData().length > 0){
        this.hotelService.hotel$.pipe(
          map(hotels => {
  
          if (hotels) {
            return hotels.map(hotel => ({
              id: hotel.uuid,
              name: hotel.name
            }));
          }
          return []; 
        })
        ).subscribe(hotels=>{
          this.optionsSelect['hotels'] = hotels;
          console.log("check optionsSelect:", this.optionsSelect)
        })
      }else{
        this.hotelService.getAllHotels({page_size:0}).pipe(
          map(hotels => {
  
            if (hotels) {
              return hotels.data.map(hotel => ({
                id: hotel.uuid,
                name: hotel.name
              }));
            }
            return []; 
          })
        ).subscribe(res=>{
          this.optionsSelect['hotels'] = res;
          console.log("check optionsSelect:", this.optionsSelect)
        })

      }
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
        this.loadRooms();
    }
  
    onResetFilter(): void {
        this.externalFilters = {};
        this.currentPage = 1;
        this.loadRooms();
    }
  
    onPageChange(page: number): void {
      this.currentPage = page;
      this.loadRooms();
    }
  
    onSearch(): void {
      this.currentPage = 1;
      this.debounceSearch.next(this.searchTerm);
    }
  
    clearSearch(): void {
      this.searchTerm = '';
      this.currentPage = 1;
      this.loadRooms();
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
      this.loadRooms();
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
          fields: ['room_number'],
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
    async toggleEditUserDrawer(room_type?: Room) {
        if (room_type) {
          this.selectedRoom=room_type;
          console.log("selected room_type", this.selectedRoom);
        }
        this.showEditUser = !this.showEditUser;
        if (this.showEditUser) {
          // ✅ Lazy import component chỉ khi cần
          const componentRef = this.editContainer.createComponent(GenericEditComponent);
          const instance = componentRef.instance as any;
  
          // ✅ Truyền Input cho component
          instance.showDrawer = true;
          instance.titleKey = 'room_type.detail';
          instance.fields = this.fields;
          instance.entityData = this.selectedRoom;
          instance.saveHandler = this.saveHandler.bind(this);
          instance.loadData = this.loadRooms.bind(this);
          instance.optionDestination = this.optionsSelect;
          instance.optionRadio = this.radioAmenityOptions;
  
          // ✅ Lắng nghe sự kiện Output
          instance.toggleDrawer.subscribe(() => this.toggleEditUserDrawer());
          instance.drawerOpenedChanged.subscribe((opened: boolean) => {
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
      this.showAddRoom = !this.showAddRoom
    }
  
    onPageSizeChange(size: number) {
        this.pageSize = size;
        this.loadRooms();
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
    onAddDrawerOpenedChanged(opened:boolean):void{
      this.showAddRoom = opened;
    }
    saveHandler(payload: any): Observable<any> {
      return this.roomService.updateRoom(payload.get('uuid'), payload);
    }
  
    addSaveHandler(payload: any): Observable<any> {
      return this.roomService.createRoom(payload);
    }
    deleteHandler(id: string): Observable<any> {
      this.selectedIds=[]
      this.hasSelectedRoom = false;
      return this.roomService.deleteRoom(id);
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
          this.rooms.forEach((room_type) => (room_type.selected = checked));
          this.toggleRow();
    }
  
    toggleRow(): void {
      this.selectedIds = this.rooms
              .filter((user) => user.selected)
              .map((user) => user.uuid);
      this.hasSelectedRoom = this.selectedIds.length >= 1;
    }

    ngOnDestroy(): void {
      // Huỷ tất cả các subscription khi component bị huỷ
      this._unsubscribeAll.next(null);
      this._unsubscribeAll.complete();
    }
}