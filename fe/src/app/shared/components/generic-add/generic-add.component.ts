import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { SharedModule } from 'app/shared/shared.module';
import { FuseDrawerComponent } from '@fuse/components/drawer';
import { fuseAnimations } from '@fuse/animations';
import { TranslocoService } from '@ngneat/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { FieldConfig } from 'app/core/admin/destination/destination.type';
import { environment } from 'environments/environment.fullstack';

@Component({
    selector: 'app-generic-add',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FuseAlertComponent,
        SharedModule,
        FuseDrawerComponent,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatRadioModule,
        MatIconModule,
    ],
    templateUrl: './generic-add.component.html',
})
export class GenericAddComponent implements OnInit {
    @Input() showDrawer: boolean = false;
    @Input() titleKey: string = 'common.add';
    @Input() fields: FieldConfig[] = [];
    @Input() saveHandler: (payload: any) => Observable<any> = () => of(null);
    @Input() loadData!: ()=>void;
    @Input() optionDestination: { id: number; name: string }[] = [];
    @Input() optionRadio: { id: number; name: string }[] = [];
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() drawerOpenedChanged = new EventEmitter<boolean>();

    @ViewChild('addForm') addForm: NgForm;

    baseUrl:string = environment.baseUrl;
    addFormGroup: UntypedFormGroup;
    alert: { type: FuseAlertType; code: string[] } = {
        type: 'success',
        code: [],
    };
    showAlert: boolean = false;
    passwordVisibility: { [key: string]: boolean } = {};
    passwordTouched: { [key: string]: boolean } = {};

    selectedFiles: { [key: string]: File | File[] } = {}; // Lưu file(s) theo field.name
    filePreviews: { [key: string]: { url: string; name: string }[] } = {}; // Lưu preview URLs cho gri
    selectedRadioValues: { [key: string]: string[] } = {};
    displayCheckbox: { [key: string]: string } = {};
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        // Tạo form động dựa trên fields
        this.addFormGroup = this._formBuilder.group(
            this.fields.reduce((controls, field) => {
                const validators = field.required
                    ? [Validators.required, ...(field.validators || [])]
                    : field.validators || [];
                controls[field.name] = [
                    { value: '', disabled: field.disabled },
                    validators,
                ];
                if (field.type === 'password') {
                    this.passwordVisibility[field.name] = false;
                    this.passwordTouched[field.name] = false;
                }
                if (field.type === 'checkbox') {
                    this.selectedRadioValues[field.name] = []; // Khởi tạo mảng cho radio
                }
                return controls;
            }, {})
        );

        // Thiết lập giá trị mặc định cho select hoặc radio nếu có
        this.fields.forEach((field) => {
            if ((field.type === 'select' || field.type === 'radio') && field.options && field.options.length > 0) {
                this.addFormGroup.get(field.name)?.patchValue(field.options[0].id);
            }
        });
        this.fields.forEach((field) => {
            if (field.type === 'file' || field.type === 'files') {
                this.selectedFiles[field.name] = field.type === 'file' ? null : [];
                this.filePreviews[field.name] = [];
                // Áp dụng validator cho file nếu required
                if (field.required) {
                    this.addFormGroup.get(field.name)?.setValidators((control) => {
                        const files = this.selectedFiles[field.name];
                        return files && (Array.isArray(files) ? files.length > 0 : !!files) ? null : { required: true };
                    });
                }
            }
        });
    }

    onToggleClick(): void {
        this.showAlert = false;
        this.clearForm();
        this.toggleDrawer.emit();
    }

    onDrawerOpenedChange(opened: boolean): void {
        if (opened) {
            this.showAlert = false;
            this.clearForm();
        }
        this.drawerOpenedChanged.emit(opened);
    }

    togglePasswordVisibility(fieldName: string): void {
        this.passwordVisibility[fieldName] = !this.passwordVisibility[fieldName];
    }

    create(): void {
        if (this.addFormGroup.invalid) {
            this.showAlert = true;
            this.alert = {
                type: 'error',
                code: ['errors.CO_E_024'],
            };
            return;
        }

        this.addFormGroup.disable();
        this.showAlert = false;
        // Sử dụng FormData để gửi file(s) + data
        const formData = new FormData();
        // Append các trường thông thường
        Object.keys(this.addFormGroup.controls).forEach((key) => {
            const control = this.addFormGroup.get(key);
            const value = control?.value;
            if (value === null || value === undefined || value === '') {
                return;
            }
            const field = this.fields.find((f) => f.name === key);
            console.log("check type:", field.type)
            if (field?.type === 'date') {
                const rawDate = this.addFormGroup.get(key)?.value;
                formData.append(key, rawDate ? new Date(rawDate).toISOString().split('T')[0] : '');
            }else if (field?.type === 'checkbox') {
                // Gửi danh sách giá trị radio
                console.log("check checkbox: ", this.selectedRadioValues[field.name])
                this.selectedRadioValues[field.name].forEach((val) => formData.append(`${field.name}`, val));
            } 
            else if (field?.type !== 'file' && field?.type !== 'files') {
                formData.append(key, this.addFormGroup.value[key]);
            }
        });

        // Append file(s)
        this.fields.forEach((field) => {
            if (field.type === 'file' || field.type === 'files') {
                const files = this.selectedFiles[field.name];
                console.log("Uploading files for field", field.name, files);
                if (files) {
                    if (field.name === 'images') {
                        // Dùng images_upload[] cho field images
                        (files as File[]).forEach((file) => formData.append('images_upload', file));
                    } else {
                        // thumbnail hoặc các field file khác
                        formData.append(field.name, files as File);
                    }
                }
            }
        });

        this.saveHandler(formData).subscribe({
            next: () => {
                this._translocoService
                    .selectTranslate('other.success_title')
                    .subscribe((title) => {
                        this._translocoService
                            .selectTranslate('common.message_success')
                            .subscribe((message) => {
                                this.alert = { type: 'success', code: [message] };
                                this.showAlert = true;
                            });
                    });
                this.addFormGroup.reset();
                this.addFormGroup.enable();
                this.clearForm();
                this.onToggleClick();
                this.loadData();
            },
            error: (err) => {
                const errorList = err?.error?.errors;
                this.alert = {
                    type: 'error',
                    code: Array.isArray(errorList)
                        ? errorList.map(e => e.field ? `${e.field}: ${e.message}` : e.message)
                        : [err?.error?.message || err?.error?.code || 'Đã xảy ra lỗi'],
                };
                this.showAlert = true;
                this.addFormGroup.enable();
            },
        });
    }

    clearForm(): void {
        this.addForm?.resetForm();
        this.fields.forEach((field) => {
            if ((field.type === 'select' || field.type === 'radio') && field.options && field.options.length > 0) {
                this.addFormGroup.get(field.name)?.patchValue(field.options[0].id);
            }
            if (field.type === 'radio') {
                this.selectedRadioValues[field.name] = []; // Reset danh sách radio
                this.addFormGroup.get(field.name)?.patchValue([]);
            }
            if (field.type === 'password') {
                this.passwordVisibility[field.name] = false;
                this.passwordTouched[field.name] = false;
            }
        });
        // Reset file(s) và preview
        this.fields.forEach((field) => {
            if (field.type === 'file' || field.type === 'files') {
                this.selectedFiles[field.name] = field.type === 'file' ? null : [];
                this.filePreviews[field.name].forEach((preview) => {
                    if (preview.url) URL.revokeObjectURL(preview.url);
                });
                this.filePreviews[field.name] = [];
            }
        });
    }

    // Hàm xử lý khi chọn file(s)
    onFileChange(event: Event, field: FieldConfig): void {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        const files = Array.from(input.files);
        if (field.type === 'file') {
            // Chỉ lấy file đầu tiên cho 'file'
            if(this.selectedFiles[field.name] && this.filePreviews[field.name]){
                // Giải phóng memory của preview cũ
                this.filePreviews[field.name].forEach(preview => {
                    if(preview.url) URL.revokeObjectURL(preview.url);
                });
                delete this.filePreviews[field.name];
                delete this.selectedFiles[field.name];

            }
            const file = files[0];
            this.selectedFiles[field.name] = file;
            this.filePreviews[field.name] = [this.createPreview(file)];
        } else if (field.type === 'files') {
            // Thêm vào mảng cho 'files'
            (this.selectedFiles[field.name] as File[]).push(...files);
            this.filePreviews[field.name].push(...files.map(this.createPreview));
        }

        // Reset input để cho phép chọn lại cùng file
        input.value = '';
        this.addFormGroup.get(field.name)?.updateValueAndValidity(); // Cập nhật validator
    }

    // Tạo preview object (url cho ảnh, hoặc fallback cho file khác)
    private createPreview(file: File): { url: string; name: string } {
        if (file.type.startsWith('image/')) {
            return { url: URL.createObjectURL(file), name: file.name };
        } else {
            // Fallback cho file không phải ảnh (có thể dùng icon, nhưng ở đây dùng tên file)
            return { url: '', name: file.name }; // Bạn có thể thêm icon SVG hoặc URL icon
        }
    }

    // Xóa file
    removeFile(fieldName: string, index: number): void {
        if (this.filePreviews[fieldName][index].url) {
            URL.revokeObjectURL(this.filePreviews[fieldName][index].url); // Giải phóng memory
        }
        this.filePreviews[fieldName].splice(index, 1);

        if (Array.isArray(this.selectedFiles[fieldName])) {
            (this.selectedFiles[fieldName] as File[]).splice(index, 1);
        } else {
            this.selectedFiles[fieldName] = null;
        }

        this.addFormGroup.get(fieldName)?.updateValueAndValidity();
    }
    // Xử lý khi chọn radio
    onRadioChange(fieldName: string, value: string): void {
        console.log("Radio changed:", fieldName, value);
        if (!this.selectedRadioValues[fieldName].includes(value)) {
            this.selectedRadioValues[fieldName].push(value);
            this.addFormGroup.get(fieldName)?.patchValue(this.selectedRadioValues[fieldName]);
            this.addFormGroup.get(fieldName)?.updateValueAndValidity();
        }
    }

    // Xóa giá trị radio khỏi danh sách
    removeRadioValue(fieldName: string, index: number,value?:any): void {
        this.selectedRadioValues[fieldName].splice(index, 1);
        this.addFormGroup.get(fieldName)?.patchValue(this.selectedRadioValues[fieldName]);
        this.addFormGroup.get(fieldName)?.updateValueAndValidity();
        delete this.displayCheckbox[value];
    }

    getOptionName(field: any, value: any): string {
        console.log("check")
        const found = field.options?.find((opt: any) => opt.id === value);
        return found ? found.name : value;
    }
    onCheckboxChange(checked: boolean, fieldName: string, value: any, option?:any) {
        
        if (!this.selectedRadioValues[fieldName]) {
            this.selectedRadioValues[fieldName] = [];
        }

        if (checked) {
            if (!this.selectedRadioValues[fieldName].includes(value)) {
            this.selectedRadioValues[fieldName].push(value);
            console.log("checkbox:", this.selectedRadioValues)
            this.displayCheckbox[option.name] = option.icon ? option.icon:null;
            }
        } else {
            this.selectedRadioValues[fieldName] = this.selectedRadioValues[fieldName].filter(v => v !== value);
            delete this.displayCheckbox[option.name];
        }
        this.addFormGroup.get(fieldName)?.setValue(this.selectedRadioValues[fieldName]);
        this.addFormGroup.get(fieldName)?.updateValueAndValidity();
        // Optional: cập nhật FormControl nếu cần
        // this.form.get(fieldName)?.setValue(this.selectedValues[fieldName]);
        }


}