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
import { Observable } from 'rxjs';
import { UserService } from 'app/core/profile/user/user.service';
import { User } from 'app/core/profile/user/user.types';
import { environment } from 'environments/environment.fullstack';
import { Amenity } from 'app/core/admin/amenity/amenity.types';
import { AmenityService } from 'app/core/admin/amenity/amenity.service';

@Component({
  selector: 'app-amenity',
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
  templateUrl: './amenity.component.html',
  styles: [`
  `]
})
export class AmenityComponent implements OnInit {
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
        labelKey: 'amenity.name',
        type: 'text',
        placeholderKey: 'amenity.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'amenity.description',
        type: 'text',
        placeholderKey: 'amenity.enterdDescription',
        required: true,
        
    },
    {
        name: 'icon',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'amenity.enterdDescription',
        accept: 'image/*',
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'amenity.name',
        type: 'text',
        placeholderKey: 'amenity.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'amenity.description',
        type: 'text',
        placeholderKey: 'amenity.enterdDescription',
        required: true,
        
    },
    {
        name: 'icon',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'amenity.enterdDescription',
        accept: 'image/*',
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'name',
          labelKey: 'amenity.name',
          type: 'text',
          placeholderKey: 'amenity.enterFullName',
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
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:Amenity = null;
  selectedIds: string[] = [];
  amenities: Amenity[] = [];
  hasSelectedAmenity:boolean= false;
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
  showAddUser: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  amenityForm = {
    name: '',
    description: ''
  };
  editingAmenity: Amenity | null = null;
  showForm = false;

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private amenityService: AmenityService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadAmenitys();
    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }

  loadAmenitys(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.amenityService.getAmenities(payload).subscribe({
      next: (response) => {
        console.log("amenity res:",response)
        this.amenities = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load amenitys',
          type: 'error'
        });
        console.error('Error loading amenitys:', error);
      }
    });
  }

  loadAutocompleteOptions(): void {
      // Cập nhật autocomplete options cho trường name
      this.amenityService.getAmenities({ page_index: 1, page_size: 1000 }).subscribe({
          next: (response) => {
              const nameField = this.filterFields.find(f => f.name === 'name');
              if (nameField) {
                  nameField.autocompleteOptions = response.data.map((dest: Amenity) => dest.name);
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
      this.loadAmenitys();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadAmenitys();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAmenitys();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadAmenitys();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadAmenitys();
  }

  showCreateForm(): void {
    this.editingAmenity = null;
    this.amenityForm = {
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
      this.loadAmenitys();
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
    this.editingAmenity = null;
    this.amenityForm = {
      name: '',
      description: ''
    };
  }

  saveAmenity(): void {
    if (!this.amenityForm.name.trim()) {
      this._alertService.showAlert({
        title: 'Validation Error',
        message: 'Name is required',
        type: 'error'
      });
      return;
    }

    const amenityData: any = {
      name: this.amenityForm.name.trim(),
      description: this.amenityForm.description.trim()
    };

    if (this.editingAmenity) {
      // Update existing amenity
      this.amenityService.updateAmenity(this.editingAmenity.uuid, amenityData).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Amenity updated successfully',
            type: 'success'
          });
          this.hideForm();
          this.loadAmenitys();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to update amenity',
            type: 'error'
          });
          console.error('Error updating amenity:', error);
        }
      });
    } else {
      // Create new amenity
      this.amenityService.createAmenity(amenityData as any).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Amenity created successfully',
            type: 'success'
          });
          this.hideForm();
          this.loadAmenitys();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to create amenity',
            type: 'error'
          });
          console.error('Error creating amenity:', error);
        }
      });
    }
  }

  deleteAmenity(amenity: Amenity): void {
    if (confirm(`Are you sure you want to delete "${amenity.name}"?`)) {
      this.amenityService.deleteAmenity(amenity.uuid).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Amenity deleted successfully',
            type: 'success'
          });
          this.loadAmenitys();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to delete amenity',
            type: 'error'
          });
          console.error('Error deleting amenity:', error);
        }
      });
    }
  }

  async toggleEditUserDrawer(amenity?: Amenity) {
      if (amenity) {
        this.selectedDes=amenity;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'amenity.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadAmenitys.bind(this);

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
    this.showAddUser = !this.showAddUser
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadAmenitys();
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
    this.showAddUser = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.amenityService.updateAmenity(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.amenityService.createAmenity(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.amenityService.deleteAmenity(id);
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
        this.amenities.forEach((amenity) => (amenity.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.amenities
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedAmenity = this.selectedIds.length >= 1;
    console.log(this.hasSelectedAmenity)
  }
}
