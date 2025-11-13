import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from 'app/core/admin/feedback/feedback.service';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoModule } from '@ngneat/transloco';
import { TranslocoService } from '@ngneat/transloco';



@Component({
  selector: 'app-add-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './add-feedback.component.html',
  

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
    private _alertService: AlertService,
    private transloco: TranslocoService
    
  ) {}

  createFeedback(): void {
    if (!this.form.title || !this.form.content) {
      this._alertService.showAlert({
        type: 'error',
        title: this.transloco.translate('errors.title'),
        message: this.transloco.translate('errors.news_required'),
      });
      return;
    }

    this.feedbackService.createFeedback(this.form).subscribe({
      next: () => {
        this._alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title'),
           message: this.transloco.translate('success.CM_S_008'),
        });

        this.refresh.emit();
        this.close.emit();
        this.resetForm();
      },
      error: (err) => {
        const msg = err?.error?.error ||  this.transloco.translate('errors.default');
        this._alertService.showAlert({
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
    this.form = {
      title: '',
      content: '',
    };
  }
}
