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
import { KnowlegdeBase } from 'app/core/admin/content/content.types';
import { KnowlegdeBaseService } from 'app/core/admin/content/content.service';

@Component({
  selector: 'app-knowlegdeBase',
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
  templateUrl: './content.component.html',
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
export class KnowlegdeBaseComponent implements OnInit {
  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'title',
        labelKey: 'knowlegdeBase.title',
        type: 'text',
        placeholderKey: 'knowlegdeBase.enterTitle',
        required: true,
        
    },
    {
        name: 'content',
        labelKey: 'knowlegdeBase.content',
        type: 'textarea',
        placeholderKey: 'knowlegdeBase.enterdContent',
        required: true,
        
    },
    {
        name: 'is_embedded',
        labelKey: 'knowlegdeBase.is_embedded',
        type: 'select',
        options:[
            {id:true, name:"True"},
            {id:false, name:"False"}
        ],
        placeholderKey: 'knowlegdeBase.enterdIsEmbedded',
        disabled:true
    }
  ]

  addFields: FieldConfig[] =[
    {
        name: 'title',
        labelKey: 'knowlegdeBase.title',
        type: 'text',
        placeholderKey: 'knowlegdeBase.enterTitle',
        required: true,
        
    },
    {
        name: 'content',
        labelKey: 'knowlegdeBase.content',
        type: 'textarea',
        placeholderKey: 'knowlegdeBase.enterdContent',
        required: true,
        
    }
  ]

  filterFields: FieldFilterConfig[] = [
    {
        name: 'title',
        labelKey: 'knowlegdeBase.title',
        type: 'text',
        placeholderKey: 'knowlegdeBase.enterTitle'
        
    },
    {
        name: 'is_embedded',
        labelKey: 'knowlegdeBase.is_embedded',
        type: 'select',
        options:[
            {id:true, name:"True"},
            {id:false, name:"False"}
        ],
        placeholderKey: 'knowlegdeBase.enterdIsEmbedded'
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
  selectedDes:KnowlegdeBase = null;
  selectedIds: string[] = [];
  knowlegdeBases: KnowlegdeBase[] = [];
  hasSelectedKnowlegdeBase:boolean= false;
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
  
  // Sắp xếp
  sortField: string | null = null;
  sortOption: 'asc' | 'desc' | null = null;

  // Show popup
  showEditUser: boolean = false;
  showAddUser: boolean = false;
  showFilter: boolean = false;
  showDeleteDialog:boolean = false; 

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private knowlegdeBaseService: KnowlegdeBaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadKnowlegdeBases();
    this.userService.user$.subscribe((user)=>{
      this.user = user;
    })
  }

  loadKnowlegdeBases(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.knowlegdeBaseService.getKnowlegdeBase(payload).subscribe({
      next: (response) => {
        console.log("knowlegdeBase res:",response)
        this.knowlegdeBases = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load knowlegdeBases',
          type: 'error'
        });
        console.error('Error loading knowlegdeBases:', error);
      }
    });
  }

//   

  toggleFilterDrawer(): void {
        this.showFilter = !this.showFilter;
    }
  
  toggleEditFilterDrawer():void{
      this.showFilter = !this.showFilter;
  }

  onFilterDrawerOpenedChanged(opened: boolean): void {
      this.showFilter = opened;
  }

  onApplyFilter(filterRules: any[]): void {
      this.externalFilters = filterRules;
      this.currentPage = 1;
      this.loadKnowlegdeBases();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadKnowlegdeBases();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadKnowlegdeBases();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadKnowlegdeBases();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadKnowlegdeBases();
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
      this.loadKnowlegdeBases();
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
        fields: ['title', 'uuid'],
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

  async toggleEditUserDrawer(knowlegdeBase?: KnowlegdeBase) {
      if (knowlegdeBase) {
        this.selectedDes=knowlegdeBase;
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        // ✅ Lazy import component chỉ khi cần
        const { GenericEditComponent } = await import('app/shared/components/generic-components');
        const componentRef = this.editContainer.createComponent(GenericEditComponent);

        // ✅ Truyền Input cho component
        componentRef.instance.showDrawer = true;
        componentRef.instance.titleKey = 'knowlegdeBase.detail';
        componentRef.instance.fields = this.fields;
        componentRef.instance.entityData = this.selectedDes;
        componentRef.instance.saveHandler = this.saveHandler.bind(this);
        componentRef.instance.loadData = this.loadKnowlegdeBases.bind(this);

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
      this.loadKnowlegdeBases();
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
    this.showAddUser = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.knowlegdeBaseService.updateKnowlegdeBase(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.knowlegdeBaseService.createKnowlegdeBase(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    this.hasSelectedKnowlegdeBase = false;
    return this.knowlegdeBaseService.deleteKnowlegdeBase(id);
  }

  toggleDeleteDialog(uuid?:string): void {
      if (uuid) {
        this.selectedIds = [...this.selectedIds, uuid];
      }
      this.showDeleteDialog = !this.showDeleteDialog;
  }

  toggleAllRows(event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
        this.knowlegdeBases.forEach((knowlegdeBase) => (knowlegdeBase.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.knowlegdeBases
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedKnowlegdeBase = this.selectedIds.length >= 1;
  }
}