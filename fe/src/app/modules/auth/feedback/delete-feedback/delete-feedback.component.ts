import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';
import { AlertService } from 'app/core/alert/alert.service';
import { forkJoin } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-delete-feedback',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './delete-feedback.component.html',
})
export class DeleteFeedbackComponent {
  @Input() feedbackId?: number;
  @Input() feedbackIds?: number[];
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  isDeleting = false;

  constructor(
    private feedbackService: FeedbackService,
    private alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  get idsToDelete(): number[] {
    if (this.feedbackIds?.length) return this.feedbackIds;
    if (this.feedbackId != null) return [this.feedbackId];
    return [];
  }

  delete(): void {
    if (this.isDeleting) return;
    if (this.idsToDelete.length === 0) return;

    this.isDeleting = true;

    const deleteRequests = this.idsToDelete.map((id) =>
      this.feedbackService.deleteFeedback(id)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('success.CM_S_011'), // Xóa lọc thành công
          message: `${this.idsToDelete.length} ${this.transloco.translate('success.CM_S_011')}`,
        });

        setTimeout(() => {
          this.refresh.emit();
          this.close.emit();
        }, 1000);
      },
      error: () => {
        this.alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('errors.default'),
          message: this.transloco.translate('errors.default'),
        });
        this.isDeleting = false;
      },
    });
  }

  cancel(): void {
    this.close.emit();
  }
}
