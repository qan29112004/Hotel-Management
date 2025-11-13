import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from 'app/core/admin/content/content.service';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-add-content',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './add-content.component.html',
  styleUrls: ['./add-content.component.scss'],
})
export class AddContentComponent {
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  form = {
    title: '',
    content: '',
  };

  constructor(
    private contentService: ContentService,
    private _alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  createContent(): void {
    if (!this.form.title || !this.form.content) {
      this._alertService.showAlert({
        type: 'error',
        title: this.transloco.translate('errors.default') ,
        message: this.transloco.translate('errors.fields.title_content'),
      });
      return;
    }

    this.contentService.createContents(this.form).subscribe({
      next: () => {
        this._alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title') ,
          message: this.transloco.translate('success.CM_S_008'),
        });

        this.refresh.emit();
        this.close.emit();
        this.resetForm();


      },
      error: (err) => {
        const msg = err?.error?.error || this.transloco.translate('errors.default') ;
        this._alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('errors.default') ,
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
