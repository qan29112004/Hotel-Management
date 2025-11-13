import { Component, EventEmitter, HostListener, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { SharedModule } from 'app/shared/shared.module';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, SharedModule],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  templateUrl: './preview.component.html',
  styles: ``,
  encapsulation: ViewEncapsulation.None

})
export class PreviewComponent {
  @Output() close = new EventEmitter<void>();
  @Input() formJson: any[] = [];

  showPreview = true;
  isClosing = false;

  onClose(): void {
    this.isClosing = true;
    this.showPreview = false; // trigger :leave animation
  }

  onAnimationDone(event: AnimationEvent): void {
    const toState = (event as any).toState;
    if (this.isClosing && toState === 'void') {
      this.close.emit();
      this.isClosing = false;
    }
  }

  // Danh sách các kích thước
  sizes = [
    { label: 'Mobile', icon: 'smartphone', class: 'w-[375px]', minWidth: 0 },
    { label: 'Small', icon: 'tablet', class: 'w-[844px]', minWidth: 376 },
    { label: 'Medium', icon: 'tablet_android', class: 'w-[850px]', minWidth: 845 },
    { label: 'Large', icon: 'laptop', class: 'w-[1280px]', minWidth: 851 },
    { label: 'Full', icon: 'desktop_windows', class: 'w-full', minWidth: 1281 }
  ];

  popupSize = 'w-full'; // giá trị mặc định
  currentWidth: number = window.innerWidth; // Lưu giữ kích thước hiện tại của cửa sổ

  constructor() {
    // Check thay đổi kích thước cửa sổ
    this.checkWindowSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.currentWidth = window.innerWidth;
    this.checkWindowSize();
  }

  // Kiểm tra kích thước cửa sổ và cập nhật kích thước popup tương ứng
  checkWindowSize() {
    if (this.currentWidth <= 375) {
      this.popupSize = 'w-[375px]'; // Mobile
    } else if (this.currentWidth <= 844) {
      this.popupSize = 'w-[844px]'; // Small
    } else if (this.currentWidth <= 850) {
      this.popupSize = 'w-[850px]'; // Medium
    } else if (this.currentWidth <= 1280) {
      this.popupSize = 'w-[1280px]'; // Large
    } else {
      this.popupSize = 'w-full'; // Full
    }
  }

  getVisibleSizes() {
    return this.sizes.filter(size => this.currentWidth >= size.minWidth);
  }

  // Thay đổi kích thước popup khi nhấn nút
  changePopupSize(sizeClass: string) {
    this.popupSize = sizeClass;
  }

  //Trả về name của option đang được chọn trong một field kiểu select.
  getOptionName(field: any): string {
    if (!field?.options || !Array.isArray(field.options)) return 'N/A';
    const selected = field.options.find((opt: any) => opt.id === field.value);
    return selected?.name || 'N/A';
  }


  formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
  }


}
