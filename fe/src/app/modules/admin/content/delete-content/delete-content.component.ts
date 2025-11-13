import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from 'app/core/admin/content/content.service';
import { AlertService } from 'app/core/alert/alert.service';
import { forkJoin } from 'rxjs';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-delete-content',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './delete-content.component.html',
})
export class DeleteContentComponent {
  @Input() contentId?: number;
  @Input() contentIds?: number[];
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  isDeleting = false;

  constructor(
    private contentService: ContentService,
    private _alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  get idsToDelete(): number[] {
    if (this.contentIds?.length) return this.contentIds;
    if (this.contentId != null) return [this.contentId];
    return [];
  }

  delete(): void {
    if (this.isDeleting) return;
    if (this.idsToDelete.length === 0) return;

    this.isDeleting = true;

    const deleteRequests = this.idsToDelete.map(id =>
      this.contentService.deleteContent(id)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this._alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title') ,
          message: this.transloco.translate('success.CM_S_011')?.replace('{count}', this.idsToDelete.length.toString())
            || `${this.idsToDelete.length} `,
        });

        setTimeout(() => {
          this.refresh.emit();
          this.close.emit();
        }, 1000);
      },
      error: () => {
        this._alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('common.delete'),
          message: this.transloco.translate('errors.default') ,
        });
        this.isDeleting = false;
      }
    });
  }

  cancel(): void {
    this.close.emit(); // đóng popup/xác nhận
  }
}
