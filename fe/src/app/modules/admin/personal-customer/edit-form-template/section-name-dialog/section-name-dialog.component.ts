import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { SharedModule } from 'app/shared/shared.module';
import { fadeInOut } from 'app/shared/components/animations/fade.animation';

@Component({
  selector: 'app-section-name-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule],
  animations: [fadeInOut],
  templateUrl: './section-name-dialog.component.html',
  styles: ``
})
export class SectionNameDialogComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() initialName: string = '';
  @Input() isEdit = false;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<string>();

  sectionForm!: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private _alertService: AlertService,
    private _translocoService: TranslocoService,
  ) { }

  ngOnInit(): void {
    this.sectionForm = this._formBuilder.group({
      name: ['', Validators.required]
    });
  }

  // ✅ cập nhật giá trị khi initialName thay đổi
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialName'] && this.sectionForm) {
      this.sectionForm.get('name')?.setValue(this.initialName || '');
    }
  }

  submit(): void {
    if (this.sectionForm.valid) {
      this.sectionForm.disable();

      this._alertService.showAlert({
        title: this._translocoService.translate('other.success_title'),
        message: this.isEdit ? 'Chỉnh sửa tên vùng thành công' : 'Thêm vùng thành công',
        type: 'success',
      });
      this.confirmed.emit(this.sectionForm.value.name);
      this.sectionForm.reset();
      this.sectionForm.enable();
      this.closePopup();
    }
    else {
      this.sectionForm.markAllAsTouched(); // đánh dấu toàn bộ các control trong form là đã chạm (touched)
    }
  }

  cancel(): void {
    this.closePopup();
  }

  private closePopup(): void {
    this.closed.emit();
    this.reset();
  }

  private reset(): void {
    this.sectionForm.reset();
  }
}