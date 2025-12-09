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
import { PriceRule } from 'app/core/admin/price-rule/price-rule.types';
import { PriceRuleService } from 'app/core/admin/price-rule/price-rule.service';
import { HotelService } from 'app/core/admin/hotel/hotel.service';


@Component({
  selector: 'app-priceRule',
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
  templateUrl: './price-rule.component.html',
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
export class PriceRuleComponent implements OnInit {
  fields: FieldConfig[] =[
    {
        name: 'uuid',
        labelKey: 'uuid',
        type: 'text',
        required: true,
        disabled: true,
    },
    {
        name: 'ruleType',
        labelKey: 'priceRule.code',
        type: 'select',
        options:[
          {id:'Weekend', name:'Weekend'},
          {id:'Holiday', name:'Holiday'},
          {id:'Occupancy', name:'Occupancy'}
        ],
        placeholderKey: 'priceRule.enterCode',
        required: true,
    },
    {
        name: 'multiplier',
        labelKey: 'priceRule.title',
        type: 'number',
        placeholderKey: 'priceRule.entertitle',
        required: true,
        helpText:"Nhập từ 0 đến 2"
    }
    
  ]

  addFields: FieldConfig[] =[
    {
        name: 'rule_type',
        labelKey: 'priceRule.code',
        type: 'select',
        options:[
          {id:'Weekend', name:'Weekend'},
          {id:'Holiday', name:'Holiday'},
          {id:'Occupancy', name:'Occupancy'}
        ],
        placeholderKey: 'priceRule.enterCode',
        required: true,
    },
    {
        name: 'multiplier',
        labelKey: 'priceRule.title',
        type: 'number',
        placeholderKey: 'priceRule.entertitle',
        required: true,
        helpText:"Nhập từ 0 đến 2"
    }
  ]

  filterFields: FieldFilterConfig[] = [
      {
          name: 'title',
          labelKey: 'priceRule.title',
          type: 'text',
          placeholderKey: 'priceRule.enterTitle',
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
      }
  ];
  @ViewChild('editContainer', { read: ViewContainerRef }) editContainer: ViewContainerRef;
  baseUrl = environment.baseUrl;
  user:User
  selectedDes:PriceRule = null;
  selectedIds: string[] = [];
  optionsHotel:any[];
  priceRules: PriceRule[] = [];
  hasSelectedPriceRule:boolean= false;
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
  showAddPriceRule: boolean = false;
  showImport: boolean = false;
  showFilter: boolean = false;
  showFilterModal: boolean = false;
  showDeleteDialog:boolean = false; 
  // Form data for create/edit
  priceRuleForm = {
    name: '',
    description: ''
  };
  editingPriceRule: PriceRule | null = null;
  showForm = false;

  private debounceSearch = new Subject<string>();
  private destroy$ = new Subject<any>();

  constructor(
    public translocoService: TranslocoService,
    private _alertService: AlertService,
    private priceRuleService: PriceRuleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private userService: UserService,
    private hotelService:HotelService
  ) {}

  ngOnInit(): void {
    this.loadPriceRule();
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
      this.loadPriceRule();
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

  loadPriceRule(): void {
    this.loading = true;
    const payload = this.getPayload();

    this.priceRuleService.getPriceRule(payload).subscribe({
      next: (response) => {
        console.log("priceRule res:",response)
        this.priceRules = response.data || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this._alertService.showAlert({
          title: 'Error',
          message: 'Failed to load priceRules',
          type: 'error'
        });
        console.error('Error loading priceRules:', error);
      }
    });
  }

  // loadAutocompleteOptions(): void {
  //     // Cập nhật autocomplete options cho trường name
  //     this.priceRuleService.getPriceRule({ page_index: 1, page_size: 1000 }).subscribe({
  //         next: (response) => {
  //             const nameField = this.filterFields.find(f => f.name === 'title');
  //             if (nameField) {
  //                 nameField.autocompleteOptions = response.data.map((dest: PriceRule) => dest.title);
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
  
  toggleEditFilterDrawer(): void {
      this.showFilter = !this.showFilter;
  }

  onFilterDrawerOpenedChanged(opened: boolean): void {
      this.showFilter = opened;
  }

  onApplyFilter(filterRules: any[]): void {
      this.externalFilters = filterRules;
      this.currentPage = 1;
      this.loadPriceRule();
  }

  onResetFilter(): void {
      this.externalFilters = {};
      this.currentPage = 1;
      this.loadPriceRule();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPriceRule();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.debounceSearch.next(this.searchTerm)
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPriceRule();
  }

  showCreateForm(): void {
    this.editingPriceRule = null;
    this.priceRuleForm = {
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
      this.loadPriceRule();
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
    this.editingPriceRule = null;
    this.priceRuleForm = {
      name: '',
      description: ''
    };
  }

  async toggleEditUserDrawer(priceRule?: PriceRule) {
      if (priceRule) {
        this.selectedDes=priceRule;
        console.log("selected: ", this.selectedDes)
      }
      this.showEditUser = !this.showEditUser;
      if (this.showEditUser) {
        const componentRef = this.editContainer.createComponent(GenericEditComponent);
        const instance = componentRef.instance as any;

        // ✅ Truyền Input cho component
        instance.showDrawer = true;
        instance.titleKey = 'priceRule.detail';
        instance.fields = this.fields;
        instance.entityData = this.selectedDes;
        instance.saveHandler = this.saveHandler.bind(this);
        instance.loadData = this.loadPriceRule.bind(this);
        instance.optionDestination = this.optionsHotel;

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
    this.showAddPriceRule = !this.showAddPriceRule
  }

  onPageSizeChange(size: number) {
      this.pageSize = size;
      this.loadPriceRule();
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
    this.showAddPriceRule = opened;
  }
  saveHandler(payload: any): Observable<any> {
    return this.priceRuleService.updatePriceRule(payload.get('uuid'), payload);
  }

  addSaveHandler(payload: any): Observable<any> {
    return this.priceRuleService.createPriceRule(payload);
  }
  deleteHandler(id: string): Observable<any> {
    this.selectedIds=[]
    this.hasSelectedPriceRule = false;
    return this.priceRuleService.deletePriceRule(id);
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
        this.priceRules.forEach((priceRule) => (priceRule.selected = checked));
        this.toggleRow();
  }

  toggleRow(): void {
    this.selectedIds = this.priceRules
            .filter((user) => user.selected)
            .map((user) => user.uuid);
    this.hasSelectedPriceRule = this.selectedIds.length >= 1;
    console.log(this.hasSelectedPriceRule)
  }
}