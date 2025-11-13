import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'app/shared/shared.module';
import { PreviewComponent } from '../preview/preview.component';
import { ActivatedRoute, Router } from '@angular/router';
import { routeConfig } from 'app/core/uri/config.route';
import { FieldConfig, FormTemplateRequest, SectionConfig, FormTemplate } from 'app/core/admin/custom-form-template/custom-form-template.types';
import { DetailInputComponent } from '../detail-input/detail-input.component';
import { CustomFormTemplateService } from 'app/core/admin/custom-form-template/custom-form-template.service';
import { forkJoin } from 'rxjs';
import { AlertService } from 'app/core/alert/alert.service';
import { FuseConfirmationConfig, FuseConfirmationService } from '@fuse/services/confirmation';
import { TranslocoService } from '@ngneat/transloco';
import { SectionNameDialogComponent } from './section-name-dialog/section-name-dialog.component';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-edit-form',
  standalone: true,
  imports: [CommonModule, SharedModule, SectionNameDialogComponent, PreviewComponent, DetailInputComponent],
  templateUrl: './edit-form-template.component.html',
  styles: `
    .main-content ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
    }
  `
})
export class EditFormComponent implements OnInit {
  // Trạng thái tải dữ liệu
  isLoading: boolean = false;

  @Input() fields: any[] = [];
  @Output() viewField = new EventEmitter<any>();
  activeTab: string = 'edit'; // mặc định tab active

  allSections: SectionConfig[];
  availableSection: SectionConfig;
  mainSections: SectionConfig[];

  formTemplate: FormTemplate;
  fieldList: FieldConfig[] = [];
  formTemplateForm: FormGroup;

  showSectionDialog = false;
  isEditingSection = false;
  editingSectionIndex: number | null = null;
  sectionInitialName = ''; // Truyền xuống popup

  searchFieldText: string = '';

  constructor(
    private _customFormTemplateService: CustomFormTemplateService,
    private _alertService: AlertService,
    private _fuseConfirmationService: FuseConfirmationService,
    private _translocoService: TranslocoService,
    private _formBuilder: FormBuilder,
    private el: ElementRef,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  initForm(): void {
    this.formTemplateForm = this._formBuilder.group({
      name: [this.formTemplate?.name || ''],
      description: [this.formTemplate?.description || ''],
      type: ['customer']
    });
  }

  loadData(): void {
    this.isLoading = true;

    const id = Number(this._activatedRoute.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.isLoading = false;
      return;
    }

    forkJoin([
      this._customFormTemplateService.getFormById(id),
      this._customFormTemplateService.getFields()
    ]).subscribe({
      next: ([formResponse, fieldResponse]) => {
        this.handleFormData();
        this.handleFieldData();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('API Error:', err);
      }
    });
  }

  handleFormData(): void {
    // Lấy dữ liệu form từ form$
    this._customFormTemplateService.forms$.subscribe((form) => {
      if (!form || (Array.isArray(form) && form.length === 0)) {
        this._router.navigateByUrl(`${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`);
        return;
      }
      this.formTemplate = Array.isArray(form) ? form[0] : form;
      this.initForm();
    });
  }

  handleFieldData(): void {
    // Lấy dữ liệu field từ fields$
    this._customFormTemplateService.fields$.subscribe((fields) => {
      this.fieldList = fields;

      this.allSections = [
        {
          id: 0,
          title: '',
          section: 0,
          fields: this.fieldList
        }
      ];

      if (this.formTemplate?.sections?.length) {
        for (const section of this.formTemplate.sections) {
          this.allSections.push({
            id: section.id ?? null,
            title: section.title,
            section: section.section,
            fields: section.fields,
          });
        }
      }

      this.filterUsedFields();
      this.availableSection = this.allSections[0];
      this.mainSections = this.allSections.slice(1);
      this.onSearchChange();
    });
  }

  filterUsedFields(): void {
    const usedFieldNames = new Set<string>();

    // Duyệt qua toàn bộ section ngoại trừ section[0] (sidebar), để gom các field đã dùng
    this.allSections.forEach(section => {
      if (section.section !== 0) {
        section.fields.forEach(field => usedFieldNames.add(field.name));
      }
    });

    // Lọc lại fieldList để loại bỏ những field đã dùng
    this.fieldList = this.fieldList.filter(field => !usedFieldNames.has(field.name));

    // Cập nhật lại fields của section 0 (sidebar)
    const sidebarSection = this.allSections.find(section => section.section === 0);
    if (sidebarSection) {
      sidebarSection.fields = this.fieldList;
    }
  }

  onSearchChange(): void {
    const keyword = this.searchFieldText.toLowerCase().trim();

    if (!keyword) {
      this.fieldList = this.availableSection.fields.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      this.fieldList = this.availableSection.fields
        .filter(field => field.label.toLowerCase().includes(keyword))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  getTabClass(tab: string): string {
    return this.activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-500 hover:text-gray-700 border-transparent';
  }

  openAddSectionDialog(): void {
    this.isEditingSection = false;
    this.sectionInitialName = '';
    this.showSectionDialog = true;
  }

  openEditSectionDialog(index: number): void {
    const realIndex = index + 1; // Bỏ section 'available'
    const section = this.allSections[realIndex];

    if (section.section === 1) {
      return;
    }

    this.isEditingSection = true;
    this.editingSectionIndex = realIndex;
    this.sectionInitialName = section.title;
    this.showSectionDialog = true;
  }

  onSectionSaved(newTitle: string): void {
    if (this.isEditingSection && this.editingSectionIndex !== null) {
      this.allSections[this.editingSectionIndex].title = newTitle;
    } else {
      const newSection = {
        section: this.allSections.length,
        title: newTitle,
        fields: []
      };
      this.allSections.push(newSection);
    }

    this.mainSections = this.allSections.slice(1);
    this.showSectionDialog = false;
    this.editingSectionIndex = null;
  }

  onDialogClosed(): void {
    this.showSectionDialog = false;
    this.editingSectionIndex = null;
  }

  removeSection(index: number): void {
    const realIndex = index + 1; // Vì mainSections = sections.slice(1)
    const sectionToRemove = this.allSections[realIndex];

    if (sectionToRemove.section === 1) {
      return;
    }

    var config: FuseConfirmationConfig = {
      title: this._translocoService.translate('custom_form.confirm_remove_section_title', { title: sectionToRemove.title }),
      message: this._translocoService.translate('custom_form.remove_section_confirm'),
      icon: { show: true, name: 'heroicons_outline:trash', color: 'warn' },
      actions: {
        confirm: { show: true, label: this._translocoService.translate('other.remove'), color: 'warn' },
        cancel: { show: true, label: this._translocoService.translate('other.cancel') }
      },
      dismissible: true
    }

    const dialogRef = this._fuseConfirmationService.open(config);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirmed') {
        // Di chuyển các fields của section này vào sidebar
        this.availableSection.fields.push(...sectionToRemove.fields);

        // Xóa vùng khỏi danh sách sections
        this.allSections.splice(realIndex, 1);

        // Cập nhật lại mainSections sau khi xóa
        this.mainSections = this.allSections.slice(1);

        this.onSearchChange();
      }
    });
  }

  dropField(event: CdkDragDrop<FieldConfig[]>) {
    const fromSidebar = event.previousContainer.id === 'sidebar';
    const field = event.previousContainer.data[event.previousIndex];

    const toSec = this.allSections.find(s => s.fields === event.container.data);
    if (!toSec) return;

    if (['full_name', 'assigned_by'].includes(field.name) && toSec.section !== 1) {
      this._fuseConfirmationService.open({
        title: this._translocoService.translate('other.error_title'),
        message: this._translocoService.translate('custom_form.cannot_move_required_field', { label: field.label }),
        icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'error' },
        actions: {
          confirm: { show: true, label: this._translocoService.translate('other.close'), color: 'warn' },
          cancel: { show: false, label: this._translocoService.translate('other.cancel') }
        },
        dismissible: false
      }).afterClosed().subscribe();
      return;
    }

    if (fromSidebar) {
      // Kéo từ sidebar vào
      const newField: FieldConfig = { ...field, show_field_options: false };
      toSec.fields.splice(event.currentIndex, 0, newField);

      const sidebarIdx = this.availableSection.fields.findIndex(x => x.id === field.id);
      if (sidebarIdx !== -1) this.availableSection.fields.splice(sidebarIdx, 1);
    }
    else {
      const fromSec = this.allSections.find(s => s.fields === event.previousContainer.data);
      if (!fromSec) return;

      const fromIdx = fromSec.fields.findIndex(x => x.id === field.id);

      if (fromSec.section === toSec.section) {
        moveItemInArray(toSec.fields, fromIdx, event.currentIndex);
      } else {
        if (fromIdx !== -1) {
          fromSec.fields.splice(fromIdx, 1);
          toSec.fields.splice(event.currentIndex, 0, field);
        }
      }
    }
    this.onSearchChange();
  }

  toggleOptions(event: MouseEvent, section: any, index: number): void {
    event.stopPropagation();
    section.fields[index].show_field_options = !section.fields[index].show_field_options;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    // Kiểm tra xem có phải click ngoài popup không
    const popup = this.el.nativeElement.querySelector('.popup-options'); // Đảm bảo class này là của popup
    if (popup && !popup.contains(event.target)) {
      // Nếu click ngoài popup, đóng tất cả các popup options
      this.closeAllPopups();
    }
  }

  // Hàm đóng tất cả các popup options
  closeAllPopups(): void {
    for (const section of this.allSections) {
      for (const field of section.fields) {
        field.show_field_options = false;
      }
    }
  }

  markAsRequired(section: any, index: number): void {
    section.fields[index].config.required = !section.fields[index].config.required;
    section.fields[index].show_field_options = false;
  }

  popupDetail: any = null;

  viewDetails(section: any, index: number): void {
    this.popupDetail = section.fields[index]; // Lưu dữ liệu để truyền vào popup
  }

  closeDetail() {
    this.popupDetail = null; // Đóng popup
  }

  removeField(section: any, fieldIndex: number): void {
    const field = section.fields[fieldIndex];

    if (field.name === 'full_name' || field.name === 'assigned_by') {
      return; // Không cho phép xóa
    }

    const removedField = section.fields.splice(fieldIndex, 1)[0];

    // Nếu field bị xóa không tồn tại trong Sidebar thì thêm vào lại
    const existedInSidebar = this.availableSection.fields.find(f => f.id === removedField.id);
    if (!existedInSidebar) {
      this.availableSection.fields.push({
        ...removedField,
        show_field_options: false,
      });
    }

    this.onSearchChange();
  }

  jsonOutput = '';

  saveSections(): void {
    const savedSections = this.mainSections.map(section => ({
      section: section.section,
      title: section.title,
      description: section.description,
      fields: section.fields.map(field => {
        const config: any = {};
        if (field.config?.required !== undefined) config.required = field.config.required;
        if (field.config?.max_length !== undefined && field.config.max_length !== null) {
          config.max_length = field.config.max_length;
        }

        const fieldData: any = {
          id: field.id,
          name: field.name,
          type: field.type,
          data_type: field.data_type,
          label: field.label,
          placeholder: field.placeholder
        };

        if (Object.keys(config).length > 0) {
          fieldData.config = config;
        }

        return fieldData;
      })
    }));
    this.jsonOutput = JSON.stringify(savedSections, null, 2);
    //this.activeTab = 'json';
  }

  validateAddressFields(fields: { id: number; name: string; ordering: number }[]): string | null {
    const hasProvince = fields.some(f => f.name === 'address_provinces_name');
    const hasDistrict = fields.some(f => f.name === 'address_districts_name');
    const hasWard = fields.some(f => f.name === 'address_wards_name');

    if (hasWard && !hasDistrict) {
      return 'Nếu có Xã/Phường thì bắt buộc phải có Quận/Huyện';
    }

    if (hasDistrict && !hasProvince) {
      return 'Nếu có Quận/Huyện thì bắt buộc phải có Tỉnh/Thành phố';
    }

    return null; // hợp lệ
  }

  buildSections(): FormTemplateRequest[] {
    return this.mainSections
      .filter(section => section.fields && section.fields.length > 0)
      .map(section => ({
        section: section.section,
        title: section.title,
        description: section.title,
        fields: section.fields.map((field, index) => ({
          id: field.id,
          name: field.name,
          ordering: index + 1
        }))
      }));
  }

  handleSuccess(): void {
    this._alertService.showAlert({
      title: this._translocoService.translate('other.success_title'),
      message: this._translocoService.translate('success.CF_S_007'),
      type: 'success',
    });
    this._router.navigateByUrl(`${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`);
  }

  handleError(err: any): void {
    const serverMessage = err?.error?.message || this._translocoService.translate('errors.default');
    this._alertService.showAlert({
      title: this._translocoService.translate('other.error_title'),
      message: serverMessage,
      type: 'error',
    });
  }

  onSubmit(): void {
    if (this.formTemplateForm.valid) {
      const formValue = this.formTemplateForm.getRawValue();
      const savedSections = this.buildSections();

      const allFields = savedSections.flatMap(section => section.fields);
      const errorMsg = this.validateAddressFields(allFields);
      if (errorMsg) {
        this._alertService.showAlert({
          title: 'Lỗi cấu hình biểu mẫu',
          message: errorMsg,
          type: 'error',
        });
        return;
      }

      // this.jsonOutput = JSON.stringify(formValue, null, 2);
      // this.activeTab = 'json';

      this._customFormTemplateService.updateForm(this.formTemplate.id, formValue).subscribe({
        next: (res) => {
          this._customFormTemplateService.updateFormTemplate(this.formTemplate.id, savedSections).subscribe({
            next: () => this.handleSuccess(),
            error: (err) => this.handleError(err),
          });
        },
        error: (err) => this.handleError(err),
      });
    }
  }

  onCancel(): void {
    var config: FuseConfirmationConfig = {
      title: this._translocoService.translate('other.confirm') + '?',
      message: this._translocoService.translate('custom_form.confirm_cancel_message'),
      icon: { show: true, name: 'heroicons_outline:trash', color: 'warn' },
      actions: {
        confirm: { show: true, label: this._translocoService.translate('other.confirm'), color: 'warn' },
        cancel: { show: true, label: this._translocoService.translate('other.close') }
      },
      dismissible: true
    }

    const dialogRef = this._fuseConfirmationService.open(config);
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirmed') {
        this._router.navigateByUrl(`${routeConfig.ROUTER_ADMIN}/${routeConfig.PERSONAL_CUSTOMER}`);
      }
    });
  }

  // Show popup
  showPreview = false;
  formJson: any[] = [];

  openPreview() {
    this.saveSections();

    if (!this.jsonOutput || this.jsonOutput.trim() === '') {
      console.error('jsonOutput is empty or undefined');
      this.formJson = [];
      return;
    }

    try {
      console.log('jsonOutput:', this.jsonOutput);
      const parsed = JSON.parse(this.jsonOutput);
      this.formJson = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Lỗi parse JSON:', err);
      this.formJson = [];
    }

    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }
}