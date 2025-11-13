import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { Feedback } from 'app/core/admin/feedback/feedback.types.';
import { DeleteFeedbackComponent } from '../delete-feedback/delete-feedback.component';

@Component({
  selector: 'app-update-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule,TranslocoModule,DeleteFeedbackComponent ],
  templateUrl: './update-feedback.component.html',
  styleUrls: ['./update-feedback.component.scss'] ,

})
export class UpdateFeedbackComponent implements OnInit {
  @Input() feedbackData!: Feedback;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();

  form = {
    title: '',
    content: '',
  };

  isUpdating = false;
  showDeleteForm = false;
  selectedIdToDelete: string | null = null;
  constructor(
    private feedbackService: FeedbackService,
    private _alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    if (this.feedbackData) {
      this.form.title = this.feedbackData.title;
      this.form.content = this.feedbackData.content;
    }
  }

  update(): void {
    this.isUpdating = true;

    this.feedbackService.updateFeedback(this.feedbackData.id, this.form).subscribe({
      next: () => {
        this._alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title'),
           message: this.transloco.translate('success.CM_S_009'),
        });

        setTimeout(() => {
          this.refresh.emit();
          this.close.emit();
        }, 1000);
      },
      error: (err) => {
        this._alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('other.error_title'),
           message: err?.error?.error || this.transloco.translate('errors.fields.title_content'),
        });

        this.isUpdating = false;
      },
    });
  }

  cancel(): void {
    this.close.emit();
  }
  
   openDeleteForm(): void {
    this.showDeleteForm = true;
  }

  cancelDeleteForm(): void {
    this.showDeleteForm = false;
    this.selectedIdToDelete = null;
  }

  handleDeleteSuccess(): void {
    this.refresh.emit();
    this.close.emit(); // đóng cả form update nếu xóa thành công
  }
  onDelete(): void {
  this.delete.emit(this.feedbackData.id);
}
handleDeleteFromUpdate(id: number): void {
  
  this.showDeleteForm = true;  // mở form xóa
}
}
