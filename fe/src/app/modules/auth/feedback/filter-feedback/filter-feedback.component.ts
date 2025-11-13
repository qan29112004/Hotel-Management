import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  OnInit,
  HostListener,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { UserService } from 'app/core/profile/user/user.service';
import { AlertService } from 'app/core/alert/alert.service';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';

@Component({
  selector: 'app-filter-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './filter-feedback.component.html'
})
export class FilterFeedbackComponent implements OnInit {
  @Input() mode: 'inline' | 'modal' = 'inline';
  @Output() filter = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @ViewChild('filterPopup') filterPopupRef!: ElementRef;

  filters = {
    created_by: '',
    updated_at: ''
  };

  users: any[] = [];

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private transloco: TranslocoService,
    private feedbackService: FeedbackService

  ) {}

  ngOnInit(): void {
    this.feedbackService.getFeedbacks().subscribe({
    next: ([feedbackList, total]) => {
      // Lấy user duy nhất từ feedbackList
      const userMap = new Map<number, any>();
      feedbackList.forEach(fb => {
        if (fb.createdBy) {
          userMap.set(fb.createdBy.id, fb.createdBy);
        }
      });
      this.users = Array.from(userMap.values());
    },
    error: (err) => console.error('lỗi', err)
  });
  }

  applyFilter(): void {
    this.filter.emit(this.filters);
    this.close.emit();
  }

  cancel(): void {
    this.close.emit();
  }
}
