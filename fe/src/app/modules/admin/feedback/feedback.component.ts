import { Component, OnInit , Output,ViewChild,ElementRef,HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';
import { Feedback } from 'app/core/admin/feedback/feedback.types.';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { AddFeedbackComponent } from '../feedback/add-feedback/add-feedback.component';
import { DeleteFeedbackComponent } from '../feedback/delete-feedback/delete-feedback.component';
import { UpdateFeedbackComponent } from '../feedback/update-feedback/update-feedback.component';
import { FilterFeedbackComponent} from '../feedback/filter-feedback/filter-feedback.component';
import { FormsModule } from '@angular/forms';
import { CustomPaginationComponent } from 'app/shared/components/custom-pagination/custom-pagination.component';
import { MatIconModule } from '@angular/material/icon';
import { values } from 'lodash';



@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    AddFeedbackComponent,
    UpdateFeedbackComponent,
    DeleteFeedbackComponent,
    FilterFeedbackComponent , 
    FormsModule,
    CustomPaginationComponent,
    MatIconModule ,
  ],
    templateUrl: './feedback.component.html',
    styleUrls: ['./update-feedback/update-feedback.component.scss'] ,
  
})
export class FeedbackComponent implements OnInit{
  @ViewChild('filterToggleBtn', { read: ElementRef }) filterToggleBtnRef!: ElementRef;
  @ViewChild('filterContainer', { read: ElementRef }) filterContainerRef!: ElementRef;
  // Trạng thái tải dữ liệu
  isLoading: boolean = false;
  
  // Chọn user
    selectedFeedbackid: number[] = [];
  
    // Dữ liệu sản phẩm
  feedbacks: Feedback[] = [];
  filteredFeedBackList: Feedback[] = [];
  realtimeFeedback: any[] = [];
  // Tìm kiếm
  searchValue: string = '';
  searchInputChanged: Subject<string> = new Subject<string>();

  // Sắp xếp
  sortField: string | null = null;
  sortOption: 'asc' | 'desc' | null = null;

  // Phân trang
  totalRecords: number = 0;
  totalItems: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;

  // Filters
  selectedCreateBy: string = '';

   // Form thêm mới
  form = {
    title: '',
    content: ''
  };
  showAddForm = false;
  
  // update feedback
  showUpdateForm = false;
  selectedFeedbackToUpdate: Feedback | null = null;
  
  // Delete
  showDeleteForm = false;
  selectedIdToDelete: number | null = null;

  //filter
  showFilter: boolean = false;
  isFiltered = false;
  currentFilterRules: any[] = [];
  selectedCreateAt: string = '';



  // checkbox
  selectedIdsToDelete: number[] = [];
  isAllSelected: boolean = false;

  constructor(private _feedbackService: FeedbackService){
  }
  

  ngOnInit(): void {
    this.loadFeedback(); // Gọi API
    this.searchInputChanged.pipe(debounceTime(300)).subscribe(() => {
    this.currentPage = 1;
    this.loadFeedback();
    });
    // this._feedbackService.getFeedbacksSSE().subscribe({
    //   next: (data) => {
    //     console.log("📥 SSE data:", data);
    //     this.realtimeFeedback = data;
    //     this.feedbacks = [...data];
    //   },
    //   error: (err) => {
    //     console.log("❌ Lỗi SSE:", err);
    //   }
    // });
  }
    
    
  //call api  
    loadFeedback(): void {
      this.isLoading = true;
      const payload = this.getPayload();   

      this._feedbackService.getFeedbacks(payload).subscribe({
        next: ([feedbacks, total]) => {
          this.feedbacks = feedbacks.map(item => ({
            ...item,
            selected: false
          }));

          this.totalRecords = total;
          this.totalItems = total; 
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
        }
      });
      
    }
  
    // sse
    


getPayload(): any {
  const payload: any = {
    pageIndex: this.currentPage,      
    pageSize: this.pageSize,         
    searchRule: null,
    filterRules: []  
  };

  const trimmedSearch = this.searchValue.trim();

  if (trimmedSearch) {
    payload.searchRule = {
      fields: ['title','content'],
      option: 'contains',
      value: trimmedSearch
    };
  }

  if (this.sortField) {
    payload.sortRule = {
      field: this.sortField,
      option: this.sortOption || 'asc'
    };
  }

  // Chỉ tạo filterRules khi có filter
  if (this.selectedCreateBy && this.selectedCreateBy.trim() !== '') {
    payload.filterRules = [{
      field: 'created_by',
      option: 'exact',
      value: this.selectedCreateBy
    }];
  }
  if (this.selectedCreateAt && this.selectedCreateAt.trim() !== '') {
    payload.filterRules = [{
      field: 'created_at',
      option: 'contains',
      value: this.selectedCreateAt
    }];
  }

  return payload;
}

trackById(index: number, item: Feedback): any {
  return item.id;
}


// search
onSearchChange(): void {
  this.searchInputChanged.next(this.searchValue);
}
// sort
onSortChange(field: string): void {
  if (this.sortField === field) {
    this.sortOption = this.sortOption === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortField = field;
    this.sortOption = 'asc';
  }
  this.loadFeedback();
}
// phân trang
onPageChange(page: number): void {
  this.currentPage = page;
  this.loadFeedback();
}
onPreviousPage(): void {
  if (this.currentPage > 1) {
    this.onPageChange(this.currentPage - 1);
  }
}
onNextPage(): void {
  if (this.hasNextPage()) {
    this.onPageChange(this.currentPage + 1);
  }
}

onPageSizeChange(size: number): void {
  this.pageSize = size;
  this.currentPage = 1;
  this.loadFeedback();
}

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const visiblePages = 5;
    const half = Math.floor(visiblePages / 2);

    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(start + visiblePages - 1, total);

    if (end - start < visiblePages - 1) {
      start = Math.max(1, end - visiblePages + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize) || 1;
  }

  hasNextPage(): boolean {
        return this.currentPage * this.pageSize < this.totalRecords;
  }
// filter
onFilterCreateByChange(userId: string): void {
  this.selectedCreateBy = userId;
  this.currentPage = 1;
  this.loadFeedback();
}
toggleFilter(): void {
  this.showFilter = !this.showFilter;
}
 @HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  const clickedInsideFilter =
    this.filterContainerRef?.nativeElement.contains(target);
  const clickedToggleBtn =
    this.filterToggleBtnRef?.nativeElement.contains(target);

  if (!clickedInsideFilter && !clickedToggleBtn && this.showFilter) {
    this.showFilter = false;
  }
}
  // Thêm fedback
  openAddForm(): void {
    this.showAddForm = true;

  }

  cancelAddForm(): void {
    this.showAddForm = false;
    this.resetForm();
  }

  createFeedback(): void {
    if (!this.form.title || !this.form.content) return;

    this._feedbackService.createFeedback(this.form).subscribe(() => {
      
      this.loadFeedback();
      this.resetForm();
      this.showAddForm = false;
    });
  }

  resetForm(): void {
    this.form = {
      title: '',
      content: ''
    };
  }

  // cập nhật phản hồi
    openUpdateForm(feedback: Feedback): void {
      this.selectedFeedbackToUpdate = feedback;
      this.showUpdateForm = true;
    }
  
    cancelUpdateForm(): void {
      this.showUpdateForm = false;
      this.selectedFeedbackToUpdate = null;
    }
  // xóa phản hồi
  
   openDeleteForm(id: number): void {
    this.selectedIdToDelete = id;
  this.selectedIdsToDelete = []; // Reset mảng xóa nhiều
  this.showDeleteForm = true;
  }

  cancelDeleteForm(): void {
    this.showDeleteForm = false;
    this.selectedIdToDelete = null;
  }
  deleteSelectedItems(): void {
  this.selectedIdsToDelete = this.feedbacks
    .filter(item => item.selected)
    .map(item => item.id);

  if (this.selectedIdsToDelete.length > 0) {
    this.selectedIdToDelete = null; // Reset id xóa riêng
    this.showDeleteForm = true;
  }
}



  // sort
  sortBy(field: string): void {
    console.log('Sorting by:', field);
  if (this.sortField === field) {
    this.sortOption = this.sortOption === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortField = field;
    this.sortOption = 'asc';
  }

  this.loadFeedback(); // Gọi lại API với sort mới
}

  // filter feedback
  applyFilter(): void {
  const keyword = this.searchValue.toLowerCase().trim();

  this.filteredFeedBackList = this.feedbacks.filter(item =>
    item.title?.toLowerCase().includes(keyword) ||
    item.content?.toLowerCase().includes(keyword) ||
    item.createdBy?.username?.toLowerCase().includes(keyword) || 
    item.updatedBy?.username?.toLowerCase().includes(keyword)
  );
  this.totalItems = this.filteredFeedBackList.length;
  this.currentPage = 1;
  
}
clearFilter(): void {
  this.isFiltered = false;
  this.loadFeedback(); 
}
handleAdvancedFilter(rawFilters: any): void {
  const filterRules = [];

  if (rawFilters.created_by?.toString().trim()) {
    filterRules.push({
      field: 'created_by',
      option: 'exact',
      value: rawFilters.created_by.trim()
    });
  }

  if (rawFilters.created_at?.toString().trim()) {
    filterRules.push({
      field: 'created_at',
      option: 'contains',
      value: rawFilters.created_at.trim()
    });
  }

  const payload = {
    pageIndex: 1,
    pageSize: this.pageSize,
     filterRules: filterRules,
    
  };


  this.isLoading = true;
  this._feedbackService.getFeedbacks(payload).subscribe({
    next: ([feedbacks, total]) => {
      this.isLoading = false;
      this.feedbacks = feedbacks || [];
      this.totalItems = total || 0;
      this.currentPage = 1;
      this.isFiltered = true; 
    },
    error: (err) => {
      console.error('❌ Lọc thất bại:', err);
      this.isLoading = false;
    }
  });

}



// checkbox
onDeleteRefresh(): void {
  this.isAllSelected = false;
  this.feedbacks.forEach(item => item.selected = false);
  this.selectedIdsToDelete = [];
  this.loadFeedback();
}

onItemSelectionChange(): void {
  this.isAllSelected = this.feedbacks.every(item => item.selected);
  this.updateSelectedIds();
}



toggleSelectAll(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  this.isAllSelected = checked;
  this.feedbacks.forEach(f => f.selected = checked);
  this.updateSelectedIds();
}

updateSelectedIds(): void {
  this.selectedIdsToDelete = this.feedbacks
    .filter(item => item.selected)
    .map(item => item.id);
}
get hasSelectedItems(): boolean {
  return this.feedbacks.some(c => c.selected);
}

}
