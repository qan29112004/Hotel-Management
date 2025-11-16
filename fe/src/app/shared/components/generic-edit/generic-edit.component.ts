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
import { AlertService } from 'app/core/alert/alert.service';
import { camelToSnake } from 'app/shared/utils/util';
import { SelectCountryComponent } from '../select-country/select-country.component';

@Component({
    selector: 'app-generic-edit',
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
        SelectCountryComponent
    ],
    templateUrl: './generic-edit.component.html',
})
export class GenericEditComponent implements OnInit {
    @Input() showDrawer: boolean = false;
    @Input() titleKey: string = 'common.edit';
    @Input() fields: FieldConfig[] = [];
    @Input() entityData: any = {};
    @Input() saveHandler: (payload: any) => Observable<any> = () => of(null);
    @Input() loadData!: ()=>void;
    @Input() optionDestination!: { id: string | number; name: string }[];
    @Input() optionRadio: { id: number; name: string }[] = [];
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() drawerOpenedChanged = new EventEmitter<boolean>();
    selectedFiles: { [key: string]: File | File[] } = {}; // Lưu file(s) theo field.name
    filePreviews: { [key: string]: { url: string; name: string, isRemote: boolean }[] } = {}; // Lưu preview URLs cho gri
    deletedPaths: { [key: string]: string | string[] } = {}; // Path cần xóa ở backend
    @ViewChild('editForm') editForm: NgForm;

    userCountry:any;

    baseUrl:string = environment.baseUrl;
    editFormGroup: UntypedFormGroup;
    alert: { type: FuseAlertType; code: string[] } = {
        type: 'success',
        code: [],
    };
    showAlert: boolean = false;
    displayCheckbox: { [key: string]: string } = {};
    selectedRadioValues: { [key: string]: string[] } = {};

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _translocoService: TranslocoService,
        private _alertService: AlertService,
    ) {}

    ngOnInit(): void {
        console.log("Entity Data:", this.entityData);
        // Tạo form động dựa trên fields
        
        this.editFormGroup = this._formBuilder.group(
            this.fields.reduce((controls, field) => {
                const validators = field.required
                    ? [Validators.required, ...(field.validators || [])]
                    : field.validators || [];
                // Bỏ qua file
        if (field.type === 'file' || field.type === 'files') {
            return controls;
        }
        this.userCountry = {name:this.entityData?.['userCountry'],code:""}
        // Xác định giá trị khởi tạo
        let initialValue = '';
        const rawValue = this.entityData?.[field.name];
        console.log("rawvalue: ",rawValue)

        if (rawValue !== undefined && rawValue !== null) {
            if (field.type === 'select') {
                if (typeof rawValue === 'object' && rawValue.uuid) {
                    initialValue = rawValue.uuid;
                    console.log("check select value: ", initialValue)
                } else {
                    initialValue = rawValue;
                    console.log("check select value: ", initialValue)
                }
            } else {
                initialValue = rawValue;
            }
        }

        controls[field.name] = [
            {
                value: initialValue,
                disabled: !!field.disabled,
            },
            validators,
        ];
                if (field.type === 'checkbox') {
                    this.selectedRadioValues[field.name] = []; // Khởi tạo mảng cho radio
                }
                
                return controls;
            }, {})
        );

        // Cập nhật giá trị từ entityData
        // if (this.entityData) {
        //     this.editFormGroup.patchValue(this.entityData);
        // }
        // Xử lý preview từ entityData cho file/files
        console.log("entity: ", this.entityData)
        console.log("select: ", this.optionDestination)
        
        this.fields.forEach((field) => {
            if (field.type === 'file' || field.type === 'files') {
                this.selectedFiles[field.name] = field.type === 'file' ? null : [];
                this.filePreviews[field.name] = [];
                this.deletedPaths[field.name] = field.type === 'file' ? null : [];

                const existingData = this.entityData[field.name];
                console.log(`this.entityData[${field.name}]`, this.entityData[field.name])
                if ((field.name === 'thumbnail' || field.name === 'icon' || (field.name === 'images' && field.type =="file")) && existingData) {
                    this.filePreviews[field.name] = [{
                        url: environment.baseUrl + existingData,
                        name: this.extractFileName(existingData),
                        isRemote: true
                    }];
                } else if ((field.name === 'images' && field.type =="files") && Array.isArray(existingData) && existingData.length > 0) {
                    this.filePreviews[field.name] = existingData.map((img: any) => ({
                        url: environment.baseUrl + img.imageUrl,
                        name: this.extractFileName(img.imageUrl),
                        isRemote: true
                    }));
                }

                // Validator cho required (dựa trên preview còn lại)
                if (field.required) {
                    this.editFormGroup.addControl(field.name, this._formBuilder.control(null, (control) => {
                        const previews = this.filePreviews[field.name] || [];
                        return previews.length > 0 ? null : { required: true };
                    }));
                }
                
            }
            if (field.type=='checkbox' && this.entityData?.amenities && this.entityData.amenities.length > 0) {
                // Khởi tạo selectedRadioValues[fieldName] = danh sách id
                this.selectedRadioValues[field.name] = this.entityData.amenities.map((a: any) => a.amenityId);

                // Nếu bạn có displayCheckbox để hiển thị preview
                this.displayCheckbox = {};
                this.entityData.amenities.forEach((amenity: any) => {
                    this.displayCheckbox[amenity.amenityName] = amenity.amenityIcon || ''; 
                    console.log("entity amen: ", this.entityData.amenities)
                    console.log(this.displayCheckbox, this.selectedRadioValues)
                });
            }
            
        });
        
        console.log('Check file:')
    }

    private extractFileName(path: string): string {
        console.log("Extracting file name from path:", path);
        return path.split('/').pop() || 'unknown';
    }
    // Xử lý upload file mới
    onFileChange(event: Event, field: FieldConfig): void {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        const files = Array.from(input.files);
        if (field.type === 'file') {
            // Chỉ lấy file đầu tiên cho 'file'
            const file = files[0];
            this.selectedFiles[field.name] = file;
            if(this.filePreviews[field.name]?.[0]?.url){
                this.deletedPaths[field.name] = this.filePreviews[field.name][0].url
            }
            this.filePreviews[field.name] = [{ url: URL.createObjectURL(file), name: file.name, isRemote: false }];
        } else if (field.type === 'files') {
            // Thêm vào mảng cho 'files'
            (this.selectedFiles[field.name] as File[]).push(...files);
            this.filePreviews[field.name].push(...files.map(file => ({
                url: URL.createObjectURL(file),
                name: file.name,
                isRemote: false
            })));
        }
        console.log("Selected files:", this.selectedFiles);
        input.value = '';
        this.editFormGroup.get(field.name)?.updateValueAndValidity();
    }

    // Xóa preview
    removeFile(fieldName: string, index: number): void {
        const preview = this.filePreviews[fieldName][index];

        if (preview.isRemote) {
            // Nếu remote, thêm path vào deletedPaths
            if (preview.isRemote) {
                if (fieldName === 'thumbnail') {
                    this.deletedPaths[fieldName] = preview.url;
                } else if (fieldName === 'images') {
                    (this.deletedPaths[fieldName] as string[]).push(preview.url);
                }
            } else {
                if (preview.url) URL.revokeObjectURL(preview.url);
                if (fieldName === 'thumbnail') {
                    this.selectedFiles[fieldName] = null;
                } else if (fieldName === 'images') {
                    (this.selectedFiles[fieldName] as File[]).splice(index, 1);
                }
            }
        } else {
            // Nếu local, giải phóng URL và xóa File
            if (preview.url) URL.revokeObjectURL(preview.url);
            if (Array.isArray(this.selectedFiles[fieldName])) {
                (this.selectedFiles[fieldName] as File[]).splice(index, 1);
            } else {
                this.selectedFiles[fieldName] = null;
            }
        }

        // Xóa preview
        this.filePreviews[fieldName].splice(index, 1);

        this.editFormGroup.get(fieldName)?.updateValueAndValidity();
    }

    selectCountry(country:string, fieldName:string){
        this.editFormGroup.get(`${fieldName}`).setValue(country);
    }

    onToggleClick(): void {
        this.showAlert = false;
        this.toggleDrawer.emit();
    }

    onDrawerOpenedChange(opened: boolean): void {
        // if (opened && this.entityData) {
        //     this.editForm?.resetForm();
        //     this.editFormGroup.patchValue(this.entityData);
        //     // Tái áp dụng trạng thái disabled từ fields
        //     this.fields.forEach(field => {
        //         const control = this.editFormGroup.get(field.name);
        //         if (field.disabled) {
        //             control?.disable();
        //         } else {
        //             control?.enable();
        //         }
        //     });
        //     this.showAlert = false;
        // }
        this.drawerOpenedChanged.emit(opened);
    }

    save(): void {
        if (this.editFormGroup.invalid) {
            return;
        }

        this.editFormGroup.disable();
        this.showAlert = false;

        // Sử dụng FormData để gửi data + files + deleted paths
        const formData = new FormData();

        // Append các trường thông thường
        Object.keys(this.editFormGroup.controls).forEach((key) => {
            const control = this.editFormGroup.get(key);
            const value = control?.value;
            if (value === null || value === undefined || value === '') {
                return;
            }
            const field = this.fields.find((f) => f.name === key);
            if (field?.type === 'date') {
                const rawDate = this.editFormGroup.get(key)?.value;
                formData.append(camelToSnake(key), rawDate ? new Date(rawDate).toISOString().split('T')[0] : '');
            } else if (field?.type !== 'file' && field?.type !== 'files') {
                formData.append(camelToSnake(key), this.editFormGroup.value[key]);
            }
        });

        // Append file(s) mới upload
        this.fields.forEach((field) => {
            if (field.type === 'file' || field.type === 'files') {
                const files = this.selectedFiles[field.name];
                console.log("Uploading files for field", field.name, files);
                if (files) {
                    if (field.name === 'images' && field.type =="files") {
                        // Dùng images_upload[] cho field images
                        (files as File[]).forEach((file) => formData.append('images_upload', file));
                    } else {
                        // thumbnail hoặc các field file khác
                        formData.append(camelToSnake(field.name), files as File);
                    }
                }

                const deleted = this.deletedPaths[field.name];
                if (deleted) {
                    if (Array.isArray(deleted)) {
                        deleted.forEach((path) => formData.append(`deleted_${field.name}[]`, path));
                    } else {
                        formData.append(`deleted_${field.name}`, deleted as string);
                    }
                }
            }
            if(field.type=='checkbox'){
                this.selectedRadioValues[field.name].forEach(select =>{
                    formData.append(camelToSnake(field.name), select);
                })
            }
        });

        this.saveHandler(formData).subscribe({
            next: () => {
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                            'other.success_title'
                        ),
                        message: this._translocoService.translate(
                            'other.update'
                        ),
                        type: 'success',
                })
                this.editFormGroup.reset();
                this.editFormGroup.enable();
                this.onToggleClick();
                this.loadData();
            },
            error: (err) => {
                this.alert = {
                    type: 'error',
                    code: [`errors.${err?.error?.errors?.[0]?.field || err?.error?.code || 'default'}`],
                };
                console.log("alert code: ", this.alert.code )
                this.showAlert = true;
                this.editFormGroup.enable();
            },
        });
    }
    removeRadioValue(fieldName: string, index: number,value?:any): void {
        this.selectedRadioValues[fieldName].splice(index, 1);
        this.editFormGroup.get(fieldName)?.patchValue(this.selectedRadioValues[fieldName]);
        this.editFormGroup.get(fieldName)?.updateValueAndValidity();
        delete this.displayCheckbox[value];
    }
    onCheckboxChange(checked: boolean, fieldName: string, value: any, option?:any) {
    
        if (!this.selectedRadioValues[fieldName]) {
            this.selectedRadioValues[fieldName] = [];
        }

        if (checked) {
            if (!this.selectedRadioValues[fieldName].includes(value)) {
            this.selectedRadioValues[fieldName].push(value);
            this.displayCheckbox[option.name] = option.icon;
            }
        } else {
            this.selectedRadioValues[fieldName] = this.selectedRadioValues[fieldName].filter(v => v !== value);
            delete this.displayCheckbox[option.name];
        }

        // Optional: cập nhật FormControl nếu cần
        // this.form.get(fieldName)?.setValue(this.selectedValues[fieldName]);
        }
}