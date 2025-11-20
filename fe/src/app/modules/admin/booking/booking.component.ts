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
import { Booking } from 'app/core/admin/booking/booking.type';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';


@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [ SharedModule,
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
    MatTooltipModule],
  templateUrl: './booking.component.html',
  styles: ``
})
export class BookingComponent {
  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'userEmail',
        labelKey: 'booking.userEmail',
        type: 'text',
        placeholderKey: 'booking.enterUserEmail',
        required: true,
        
    },
    {
        name: 'userFullname',
        labelKey: 'booking.userFullname',
        type: 'text',
        placeholderKey: 'booking.enterUserFullname',
        required: true,
        
    },
    {
        name: 'userPhone',
        labelKey: 'booking.userPhone',
        type: 'text',
        placeholderKey: 'booking.enterUserPhone',
        required: true,
        
    },
    {
        name: 'userCountry',
        labelKey: 'booking.user_country',
        type: 'country',
        placeholderKey: 'booking.enterUserCountry',
        required: true,
        
    },
    {
        name: 'checkIn',
        labelKey: 'booking.start_date',
        type: 'date',
        placeholderKey: 'booking.enterStartDate',
        
        
    },
    {
        name: 'checkOut',
        labelKey: 'booking.end_date',
        type: 'date',
        placeholderKey: 'booking.enterEndDate',
        
        
    },
    {
        name: 'numGuest',
        labelKey: 'booking.num_guest',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'totalPrice',
        labelKey: 'booking.amount_days',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'status',
        labelKey: 'booking.status',
        type: 'select',
        options:[
          {id: "Pending", name:"Pending"},
          {id:"Confirm", name:"Confirm"},
          {id:"Cancelled", name:"Cancelled"},
          {id:"Check In", name:"Check In"},
          {id:"Check Out", name:"Check Out"}
        ],
        placeholderKey: 'booking.enterImages'
    },
    {
        name: 'totalRooms',
        labelKey: 'booking.amount_days',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'hotelId',
        labelKey: 'booking.hotel',
        type: 'select',
        placeholderKey: 'booking.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'userEmail',
        labelKey: 'booking.userEmail',
        type: 'text',
        placeholderKey: 'booking.enterUserEmail',
        required: true,
        
    },
    {
        name: 'userFullname',
        labelKey: 'booking.userFullname',
        type: 'text',
        placeholderKey: 'booking.enterUserFullname',
        required: true,
        
    },
    {
        name: 'userPhone',
        labelKey: 'booking.userPhone',
        type: 'text',
        placeholderKey: 'booking.enterUserPhone',
        required: true,
        
    },
    {
        name: 'userCountry',
        labelKey: 'booking.user_country',
        type: 'country',
        placeholderKey: 'booking.enterUserCountry',
        required: true,
        
    },
    {
        name: 'checkIn',
        labelKey: 'booking.start_date',
        type: 'date',
        placeholderKey: 'booking.enterStartDate',
        
        
    },
    {
        name: 'checkOut',
        labelKey: 'booking.end_date',
        type: 'date',
        placeholderKey: 'booking.enterEndDate',
        
        
    },
    {
        name: 'numGuest',
        labelKey: 'booking.num_guest',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'totalPrice',
        labelKey: 'booking.amount_days',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'status',
        labelKey: 'booking.status',
        type: 'select',
        options:[
          {id: "Pending", name:"Pending"},
          {id:"Confirm", name:"Confirm"},
          {id:"Cancelled", name:"Cancelled"},
          {id:"Check In", name:"Check In"},
          {id:"Check Out", name:"Check Out"}
        ],
        placeholderKey: 'booking.enterImages'
    },
    {
        name: 'totalRooms',
        labelKey: 'booking.amount_days',
        type: 'number',
        placeholderKey: 'booking.enterEndDate',
    },
    {
        name: 'hotelId',
        labelKey: 'booking.hotel',
        type: 'select',
        placeholderKey: 'booking.enterHotel',
        asyncOptionsKey: true,
        isForeignKey:true
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'title',
          labelKey: 'booking.title',
          type: 'text',
          placeholderKey: 'booking.enterTitle',
          autocompleteOptions: [], // Sẽ được cập nhật động
      },
      {
          name: 'check_in',
          labelKey: 'user_management.check_in',
          type: 'date-range',
          rangeFields: { from: 'created_from', to: 'created_to' },
      },
      {
          name: 'check_out',
          labelKey: 'user_management.check_out',
          type: 'date-range',
          rangeFields: { from: 'updated_from', to: 'updated_to' },
      },
      {
        name: 'hotel_id',
        labelKey: 'booking.hotel',
        type: 'select',
        placeholderKey: 'booking.enterHotel',
        asyncOptionsKey: true,
        isForeingKey:true
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Booking = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  bookings: Booking[] = [];
  hasSelectedBooking:boolean= false;
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
  showAddBooking: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  bookingForm = {
    name: '',
    description: ''
  };
  editingBooking: Booking | null = null;
  showForm = false;

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private bookingService: BookingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService
  ) {}

  ngOnInit(): void {
    this.loadBooking();
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

  loadBooking(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.bookingService.getBooking(payload).subscribe({
      next: (response) => {
        console.log("booking res:",response)
        this.bookings = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load bookings',
          type: 'error'
        });
        console.error('Error loading bookings:', error);
      }
    });
  }

  // loadAutocompleteOptions(): void {
  //     // Cập nhật autocomplete options cho trường name
  //     this.bookingService.getBooking({ page_index: 1, page_size: 1000 }).subscribe({
  //         next: (response) => {
  //             const nameField = this.filterFields.find(f => f.name === 'title');
  //             if (nameField) {
  //                 nameField.autocompleteOptions = response.data.map((dest: Booking) => dest.title);
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
      this.loadBooking();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadBooking();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBooking();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadBooking();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadBooking();
  }

  showCreateForm(): void {
    this.editingBooking = null;
    this.bookingForm = {
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
      this.loadBooking();
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
        fields: ['user_fullname', 'user_email'],
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
    this.editingBooking = null;
    this.bookingForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(booking?: Booking) {
      if (booking) {
        this.selectedDes=booking;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'booking.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadBooking.bind(this);
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
    this.showAddBooking = !this.showAddBooking
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadBooking();
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
    this.showAddBooking = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.bookingService.updateBooking(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.bookingService.createBooking(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.bookingService.deleteBooking(id);
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
        this.bookings.forEach((booking) => (booking.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.bookings
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedBooking = this.selectedIds.length >= 1;
    console.log(this.hasSelectedBooking)
  }
}
