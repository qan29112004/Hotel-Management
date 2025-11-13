import {
    Component,
    EventEmitter,
    Input,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FuseAlertType } from '@fuse/components/alert';
import { UserService } from 'app/core/profile/user/user.service';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { User } from 'app/core/profile/user/user.types';
import { Status, Role } from 'app/core/admin/user-management/user-management.types';
import { FormsModule } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { AlertService } from 'app/core/alert/alert.service';


@Component({
    selector: 'app-filter-user',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    imports: [
        CommonModule,
    FormsModule,
    TranslocoModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule, 
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
  ],
    templateUrl: './filter-user.component.html',
    styles: []
})
export class FilterUserComponent {
  @Input() mode: 'inline' | 'modal' = 'inline';
    @Input() showFilterUser: boolean = false;
    @Output() filter = new EventEmitter<any>();
    @Output() drawerOpenedChangedFilter = new EventEmitter<boolean>();
    @Output() reset = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();


    filterForm: UntypedFormGroup;
    showAlert: boolean = false;
    alert: { type: FuseAlertType; code: any } = {
        type: 'error',
        code: [],
    };

    users: User[] = [];
    roles: Role[] = [];
    statuses: Status[] = [];
    filteredPhones: string[] = [];
    showSuccessAlert: boolean = false;

    constructor(
        private _fb: UntypedFormBuilder,
        private _userService: UserService,
        private _userManagementService: UserManagementService,

    ) {}

    ngOnInit(): void {
        this.filterForm = this._fb.group({
            username: [''],
            role: [''],
            status: [''],
            phone: ['', [, AuthUtils.phoneValidator()]],
            last_login: [null],
            updated_at :[null] ,
            login_from: [null],     
           login_to: [null],        
           updated_from: [null],    
          updated_to: [null],
        });

        this.loadInitialData();
    }

    loadInitialData(): void {
        this._userService.getAllUser().subscribe({
            next: (res) => {
                this.users = res || [];
            },
            error: (err) => {
                console.error( err);
            },
        });

        this.roles = this._userManagementService.getRole();
        this.statuses = this._userManagementService
            .getStatus()
            .filter((s) => !s.is_list);
    }

    applyFilter(): void {
  if (this.filterForm.invalid) {
    this.filterForm.markAllAsTouched();
    return;
  }

  const formValues = this.filterForm.value;
  const filterRules: any[] = [];


  ['username', 'role', 'status', 'phone'].forEach(field => {
    if (formValues[field]) {
      filterRules.push({
        field,
        option: 'contains',
        value: formValues[field]
      });
    }
  });

 
  const formatDate = (d: any) => {
    if (!d) return null;
    if (d instanceof Date) return d.toISOString().split('T')[0];
    return d; 
  };


  const loginFrom = formatDate(formValues.login_from);
  const loginTo = formatDate(formValues.login_to);
  if (loginFrom && loginTo) {
    filterRules.push({
      field: 'last_login',
      option: 'range',
      value: [loginFrom, loginTo]
    });
  }

 
  const updatedFrom = formatDate(formValues.updated_from);
  const updatedTo = formatDate(formValues.updated_to);
  if (updatedFrom && updatedTo) {
    filterRules.push({
      field: 'updated_at',
      option: 'range',
      value: [updatedFrom, updatedTo]
    });
  }

  
  this.filter.emit(filterRules);
  this.drawerOpenedChangedFilter.emit(false);
}



    onPhoneInputChange(): void {
      const input = this.filterForm.get('phone')?.value?.toLowerCase() || '';
      this.filteredPhones = this.users
        .map((user) => user.phone)
        .filter((phone) => phone && phone.toLowerCase().includes(input));
    }
    resetForm(): void {
    this.filterForm.reset();
}
    resetFilter(): void {
    this.filterForm.reset();
    this.filterForm.markAsPristine();
    this.filterForm.markAsUntouched();
    this.filteredPhones = [];
    this.reset.emit();
    this.drawerOpenedChangedFilter.emit(false);
}

    cancel(): void {
        this.close.emit();  
     
    
    }
}

