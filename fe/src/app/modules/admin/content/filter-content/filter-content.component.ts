import { Component, EventEmitter, Output, OnInit,ViewChild,  ElementRef, inject ,Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from 'app/core/profile/user/user.service';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
@Component({
  selector: 'app-filter-content',
  standalone: true,
  imports: [CommonModule, FormsModule,TranslocoModule],
  templateUrl: './filter-content.component.html',
})
export class FilterContentComponent implements OnInit {
  @Input() mode: 'inline' | 'modal' = 'inline';
    @ViewChild('filterPopup') filterPopupRef!: ElementRef;

  @Output() filter = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  filters = {
    created_by: '',
    updated_by: '',
    updated_at: ''
  };

  users: any[] = [];
  private userService = inject(UserService);

  ngOnInit(): void {
    this.userService.getAllUser().subscribe({
      next: (res) => {
        this.users = res || [];
      },
      error: (err) => {
        console.error('❌ Lỗi khi load users:', err);
      }
    });
  }

  applyFilter(): void {
  const filtersToEmit = {
    ...this.filters,
    updated_at: this.filters.updated_at
      ? this.filters.updated_at.split('T')[0] 
      : null
  };

  this.filter.emit(filtersToEmit);
  this.close.emit(); 
}


  cancel(): void {
    this.filters = {
      created_by: '',
      updated_by: '',
      updated_at: ''
    };
    this.close.emit(); // đóng modal
  }
}
