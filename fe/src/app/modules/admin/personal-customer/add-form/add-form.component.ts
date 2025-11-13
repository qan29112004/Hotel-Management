import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from 'app/core/alert/alert.service';
import { CustomFormTemplateService } from 'app/core/admin/custom-form-template/custom-form-template.service';
import { FuseAlertType } from '@fuse/components/alert';
import { TranslocoService } from '@ngneat/transloco';
import { PersonalCustomerComponent } from '../personal-customer.component';
import { fadeInOut } from 'app/shared/components/animations/fade.animation';

@Component({
  selector: 'app-add-form',
  standalone: true,
  imports: [CommonModule, SharedModule],
  animations: [fadeInOut],
  templateUrl: './add-form.component.html',
  styles: ``
})
export class AddFormComponent implements OnInit, AfterViewChecked {
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('firstFocus') firstFocus!: ElementRef<HTMLInputElement>;
  private hasFocused = false;

  addForm!: FormGroup;
  loading = false;

  alert: { type: FuseAlertType; code: any } = {
    type: 'success',
    code: [],
  };
  showAlert: boolean = false;

  constructor(
    private _formBuilder: FormBuilder,
    private _alertService: AlertService,
    private _customFormTemplateService: CustomFormTemplateService,
    private _personalCustomerComponent: PersonalCustomerComponent,
    private _translocoService: TranslocoService,
  ) { }

  ngOnInit(): void {
    this.addForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: [''],
      type: ['Customer', Validators.required]
    });
  }

  ngAfterViewChecked(): void {
    if (this.isVisible && this.firstFocus && !this.hasFocused) {
      this.firstFocus.nativeElement.focus();
      this.hasFocused = true;
    }
  }

  submit(): void {
    if (this.addForm.valid) {
      this.addForm.disable();
      this.showAlert = false;
      this.loading = true;

      this._customFormTemplateService.createForm(this.addForm.value).subscribe({
        next: (res) => {
          this._alertService.showAlert({
            title: this._translocoService.translate('other.success_title'),
            message: 'Tạo thành công',
            type: 'success',
          });
          this.closeDialog();
          this._personalCustomerComponent.loadData();
        },
        error: (err) => {
          this.alert = { type: 'error', code: [], };

          const errorCode = err?.error?.code;
          const errorMessage = err?.error?.message;
          const errors = err?.error?.errors;

          if (errorCode === 'VALIDATION_ERROR' && Array.isArray(errors)) {
            this.alert.code = errors.map((e: any) => `errors.fields.${e.field}`);
          } else if (errorCode) {
            this.alert.code = [`errors.${errorCode}`];
          } else if (errorMessage) {
            // fallback nếu không có code, chỉ có message
            this.alert.code = [errorMessage];
          } else {
            this.alert.code = ['errors.default'];
          }

          this.addForm.enable();
          this.showAlert = true;
          this.loading = false;
        },
      });
    }
    else {
      this.addForm.markAllAsTouched(); // đánh dấu toàn bộ các control trong form là đã chạm (touched)
    }
  }

  closeDialog(): void {
    this.reset();
    this.closed.emit();
    this.hasFocused = false; // reset lại khi đóng
  }

  private reset(): void {
    this.addForm.reset({
      name: '',
      description: '',
      type: 'customer'
    });
    this.addForm.enable();
    this.loading = false;
    this.showAlert = false;
    this.alert = { type: 'success', code: [] };
  }
}