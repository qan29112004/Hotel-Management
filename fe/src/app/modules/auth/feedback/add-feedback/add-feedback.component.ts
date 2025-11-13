import { Component, EventEmitter, Output, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'app-add-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './add-feedback.component.html',
  styleUrls: ['./add-feedback.component.scss']
})
export class AddFeedbackComponent {
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  form = {
    title: '',
    content: '',
  };

  constructor(
    private feedbackService: FeedbackService,
    private alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  createFeedback(): void {
    if (!this.form.title || !this.form.content) {
      this.alertService.showAlert({
        type: 'error',
        title: !this.form.title
          ? this.transloco.translate('errors.fields.title')
          : this.transloco.translate('errors.fields.content'),
        message: !this.form.title
          ? this.transloco.translate('errors.fields.title')
          : this.transloco.translate('errors.fields.content'),
      });
      return;
    }

    this.feedbackService.createFeedback(this.form).subscribe({
      next: () => {
        this.alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title'),// Khởi tạo thành công
          message: this.transloco.translate('success.CM_S_008'),
        });

        this.refresh.emit();
        this.close.emit();
        this.resetForm();
      },
      error: (err) => {
        const msg =
          err?.error?.error || this.transloco.translate('errors.default');
        this.alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('errors.default'),
          message: msg,
        });
      },
    });
  }

  cancel(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.form = { title: '', content: '' };
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscKey(): void {
    this.cancel();
  }
}
