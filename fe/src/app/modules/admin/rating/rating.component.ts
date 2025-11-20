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
import { Rating } from 'app/core/admin/rating/rating.type';
import { BookingService } from 'app/core/admin/booking/booking.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';
import { RatingService } from 'app/core/admin/rating/rating.service';

@Component({
  selector: 'app-rating',
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
  templateUrl: './rating.component.html',
  styles: ``
})
export class RatingComponent {
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
        name: 'review',
        labelKey: 'rating.review',
        type: 'textarea',
        placeholderKey: 'rating.enterReview',
        required: true,
        
    },
    {
        name: 'rating',
        labelKey: 'rating.rating',
        type: 'number',
        placeholderKey: 'rating.enterRating',
        
    },
    {
        name: 'subject',
        labelKey: 'rating.subject',
        type: 'text',
        placeholderKey: 'rating.enterSubject',
        required: true,
        
    },
    {
        name: 'isActive',
        labelKey: 'rating.is_active',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rating.enterIsActive',
        
    },
    {
        name: 'hotel',
        labelKey: 'rating.hotel',
        type: 'select',
        placeholderKey: 'rating.enterRefundable',
        asyncOptionsKey: true,
        isForeignKey:true,
        disabled:true
        
        
    },
    {
        name: 'booking',
        labelKey: 'rating.booking',
        type: 'select',
        placeholderKey: 'rating.enterbooking',
        asyncOptionsKey: true,
        isForeignKey:true,
        disabled:true
        
    }
    
  ]

  addFields: FieldConfig[] =[
    {
        name: 'review',
        labelKey: 'rating.review',
        type: 'textarea',
        placeholderKey: 'rating.enterReview',
        required: true,
        
    },
    {
        name: 'rating',
        labelKey: 'rating.rating',
        type: 'number',
        placeholderKey: 'rating.enterRating',
        
    },
    {
        name: 'subject',
        labelKey: 'rating.subject',
        type: 'text',
        placeholderKey: 'rating.enterSubject',
        required: true,
        
    },
    {
        name: 'isActive',
        labelKey: 'rating.is_active',
        type: 'select',
        options:[
          {id:true, name:"True"},
          {id:false,name:"False"}
        ],
        placeholderKey: 'rating.enterIsActive',
        
    },
    {
        name: 'hotel',
        labelKey: 'rating.hotel',
        type: 'select',
        placeholderKey: 'rating.enterRefundable',
        asyncOptionsKey: true,
        isForeignKey:true,
        disabled:true
        
    },
    {
        name: 'booking',
        labelKey: 'rating.booking',
        type: 'select',
        placeholderKey: 'rating.enterbooking',
        asyncOptionsKey: true,
        isForeignKey:true,
        disabled:true
        
    }
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
        name: 'created_by_email',
        labelKey: 'rating.created_by_email',
        type: 'text',
        placeholderKey: 'rating.enterHotel',
        relatedName:'reviewrating__created_by__email',
        isForeingKey:true
    },
      {
        name: 'created_by_username',
        labelKey: 'rating.created_by_username',
        type: 'text',
        placeholderKey: 'rating.enterHotel',
        relatedName:'reviewrating__created_by__username',
        isForeingKey:true
    },
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Rating = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  optionsBooking:any[];
  ratings: Rating[] = [];
  hasSelectedRating:boolean= false;
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
  showAddRating: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  ratingForm = {
    name: '',
    description: ''
  };
  editingRating: Rating | null = null;
  showForm = false;
  checkboxServiceOptions:any = [];

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private ratingService: RatingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService,
    private bookingService:BookingService
  ) {}

  ngOnInit(): void {
    this.loadRating();
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
    this.bookingService.getBooking({page_size:0}).pipe(
      map(bookings => {
  
          if (bookings) {
            return bookings.data.map(dest => ({
              id: dest.uuid,
              name: dest.uuid
            }));
          }
          return []; 
        }
        ),
      takeUntil(this._unsubscribeAll)
    ).subscribe(bookings=>{
      this.optionsBooking = bookings;
    })

    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }


  loadRating(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.ratingService.getRating(payload).subscribe({
      next: (response) => {
        console.log("rating res:",response)
        this.ratings = response.data || [];
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
      this.loadRating();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadRating();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadRating();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRating();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadRating();
  }

  showCreateForm(): void {
    this.editingRating = null;
    this.ratingForm = {
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
      this.loadRating();
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
    this.editingRating = null;
    this.ratingForm = {
      name: '',
      description: ''
    };
  }

  

  async toggleEditUserDrawer(rating?: Rating) {
      if (rating) {
        this.selectedDes=rating;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'rating.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadRating.bind(this);
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
    this.showAddRating = !this.showAddRating
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadRating();
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
    this.showAddRating = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.ratingService.updateRating(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.ratingService.createRating(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.ratingService.deleteRating(id);
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
        this.ratings.forEach((rating) => (rating.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.ratings
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedRating = this.selectedIds.length >= 1;
    console.log(this.hasSelectedRating)
  }
}
