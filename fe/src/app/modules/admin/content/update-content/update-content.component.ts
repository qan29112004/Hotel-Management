import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from 'app/core/admin/content/content.service';
import { Content } from 'app/core/admin/content/content.types';
import { AlertService } from 'app/core/alert/alert.service';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { DeleteContentComponent } from '../delete-content/delete-content.component';

@Component({
  selector: 'app-update-content',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, DeleteContentComponent],
  templateUrl: './update-content.component.html',
  styleUrls: ['./update-content.component.scss'],
})
export class UpdateContentComponent implements OnInit {
  @Output() delete = new EventEmitter<number>();
  @Input() contentData!: Content;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  
  form = {
    title: '',
    content: '',
  };

  isUpdating = false;
  showDeleteForm = false;
  selectedIdToDelete: string | null = null;

  constructor(
    private contentService: ContentService,
    private _alertService: AlertService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    if (this.contentData) {
      this.form.title = this.contentData.title;
      this.form.content = this.contentData.content;
    }
  }

  update(): void {
    this.isUpdating = true;

    this.contentService.updateContent(this.contentData.id, this.form).subscribe({
      next: () => {
        this._alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title') ,
          message: this.transloco.translate('success.CF_S_007') ,
        });

        setTimeout(() => {
          this.refresh.emit();
          this.close.emit();
        }, 1000);
      },
      error: (err) => {
        this._alertService.showAlert({
          type: 'error',
          title: this.transloco.translate('errors.default') ,
          message: err?.error?.error || this.transloco.translate('errors.fields.title_content') ,
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
    this.delete.emit(this.contentData.id);
  }

  handleDeleteFromUpdate(id: number): void {
    this.showDeleteForm = true; // mở form xóa
  }
}
