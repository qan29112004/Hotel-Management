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
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { 
  Destination, 
  DestinationCreateRequest, 
  DestinationUpdateRequest 
} from 'app/core/admin/destination/destination.type';
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

@Component({
  selector: 'app-desination',
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
  templateUrl: './desination.component.html',
  styles: [`
  `]
})
export class DesinationComponent implements OnInit {
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
        labelKey: 'destination.name',
        type: 'text',
        placeholderKey: 'destination.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'destination.description',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        
    },
    {
        name: 'thumbnail',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'destination.enterdDescription',
        accept: 'image/*',
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'name',
        labelKey: 'destination.name',
        type: 'text',
        placeholderKey: 'destination.enterFullName',
        required: true,
        
    },
    {
        name: 'description',
        labelKey: 'destination.description',
        type: 'text',
        placeholderKey: 'destination.enterdDescription',
        required: true,
        
    },
    {
        name: 'thumbnail',
        labelKey: 'hotel.thumbnail',
        type: 'file',
        placeholderKey: 'destination.enterdDescription',
        accept: 'image/*',
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'name',
          labelKey: 'destination.name',
          type: 'text',
          placeholderKey: 'destination.enterFullName',
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
  selectedDes:Destination = null;
  selectedIds: string[] = [];
  destinations: Destination[] = [];
  hasSelectedDestination:boolean= false;
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
  destinationForm = {
    name: '',
    description: ''
  };
  editingDestination: Destination | null = null;
  showForm = false;

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private destinationService: DestinationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDestinations();
    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
    console.log(this.showFilter)
  }

  loadDestinations(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.destinationService.getDestinations(payload).subscribe({
      next: (response) => {
        console.log("destination res:",response)
        this.destinations = response.data || [];
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

  loadAutocompleteOptions(): void {
      // Cập nhật autocomplete options cho trường name
      this.destinationService.getDestinations({ page_index: 1, page_size: 1000 }).subscribe({
          next: (response) => {
              const nameField = this.filterFields.find(f => f.name === 'name');
              if (nameField) {
                  nameField.autocompleteOptions = response.data.map((dest: Destination) => dest.name);
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
      this.loadDestinations();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadDestinations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadDestinations();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadDestinations();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadDestinations();
  }

  showCreateForm(): void {
    this.editingDestination = null;
    this.destinationForm = {
      name: '',
      description: ''
    };
    this.showForm = true;
  }

  showEditForm(destination: Destination): void {
    this.editingDestination = destination;
    this.destinationForm = {
      name: destination.name || '',
      description: destination.description || ''
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
      this.loadDestinations();
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
    this.editingDestination = null;
    this.destinationForm = {
      name: '',
      description: ''
    };
  }

  saveDestination(): void {
    if (!this.destinationForm.name.trim()) {
      this._alertService.showAlert({
        title: 'Validation Error',
        message: 'Name is required',
        type: 'error'
      });
      return;
    }

    const destinationData: DestinationCreateRequest | DestinationUpdateRequest = {
      name: this.destinationForm.name.trim(),
      description: this.destinationForm.description.trim()
    };

    if (this.editingDestination) {
      // Update existing destination
      this.destinationService.updateDestination(this.editingDestination.uuid, destinationData).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Destination updated successfully',
            type: 'success'
          });
          this.hideForm();
          this.loadDestinations();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to update destination',
            type: 'error'
          });
          console.error('Error updating destination:', error);
        }
      });
    } else {
      // Create new destination
      this.destinationService.createDestination(destinationData as DestinationCreateRequest).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Destination created successfully',
            type: 'success'
          });
          this.hideForm();
          this.loadDestinations();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to create destination',
            type: 'error'
          });
          console.error('Error creating destination:', error);
        }
      });
    }
  }

  deleteDestination(destination: Destination): void {
    if (confirm(`Are you sure you want to delete "${destination.name}"?`)) {
      this.destinationService.deleteDestination(destination.uuid).subscribe({
        next: () => {
          this._alertService.showAlert({
            title: 'Success',
            message: 'Destination deleted successfully',
            type: 'success'
          });
          this.loadDestinations();
        },
        error: (error) => {
          this._alertService.showAlert({
            title: 'Error',
            message: 'Failed to delete destination',
            type: 'error'
          });
          console.error('Error deleting destination:', error);
        }
      });
    }
  }

  async toggleEditUserDrawer(destination?: Destination) {
      if (destination) {
        this.selectedDes=destination;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'destination.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadDestinations.bind(this);

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
      this.loadDestinations();
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
    return this.destinationService.updateDestination(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.destinationService.createDestination(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    return this.destinationService.deleteDestination(id);
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
        this.destinations.forEach((destination) => (destination.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.destinations
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedDestination = this.selectedIds.length >= 1;
    console.log(this.hasSelectedDestination)
  }
}
