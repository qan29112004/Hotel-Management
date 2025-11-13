import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';

@Component({
  selector: 'app-custom-pagination',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './custom-pagination.component.html',
  styles: ``
})
export class CustomPaginationComponent {
  @Input() totalRecords;
  @Input() totalItems;
  @Input() currentPage;
  @Input() pageSize;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageSizeOptions: number[] = [10, 20, 25, 50];

  isDropdownOpen = false;

  getItemRangeText(): string {
    if (this.totalRecords === 0) return '0';
    const from = (this.currentPage - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage * this.pageSize, this.totalRecords);
    return `${from}-${to}`;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  isFirstPage(): boolean {
    return this.currentPage === 1;
  }
  
  isLastPage(): boolean {
    return this.currentPage === this.getTotalPages();
  }

  get pages(): (number | string)[] {
    const pages = [];
    const total = this.getTotalPages();
    const maxVisible = 5;
    pages.push(1);

    if (total <= maxVisible) {
      for (let i = 2; i <= total; i++) pages.push(i);
    } else {
      if (this.currentPage <= 3) {
        for (let i = 2; i <= maxVisible; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (this.currentPage >= total - 2) {
        pages.push('...');
        for (let i = total - maxVisible + 2; i <= total; i++) pages.push(i);
      } else {
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.getTotalPages()) {
      this.pageChange.emit(page);
    }
  }

  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  goToNext(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  changePageSize(size: number): void {
    this.pageSizeChange.emit(size);
    this.isDropdownOpen = false;
  }
}