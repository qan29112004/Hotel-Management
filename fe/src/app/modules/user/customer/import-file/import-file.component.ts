import { CustomerComponent } from './../customer.component';
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { SharedModule } from 'app/shared/shared.module';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AlertService } from 'app/core/alert/alert.service';
import { FuseAlertType } from '@fuse/components/alert/alert.types';
import { CustomerService } from 'app/core/user/customer/customer.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-import-file',
    standalone: true,
    imports: [CommonModule, SharedModule],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('150ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0 })),
            ]),
        ]),
    ],
    templateUrl: './import-file.component.html',
    styles: ``,
    encapsulation: ViewEncapsulation.None,
})
export class ImportFileComponent {
    @Output() close = new EventEmitter<void>();
    @Output() reloadCustomers = new EventEmitter<void>();
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    showImport = true;
    isClosing = false;
    selectedFile: File | null = null;

    //File
    uploadResult: any = null;
    uploadStatus: 'success' | 'error' | null = null;
    uploadTime: string = '';

    errorLogDownloadLink: string = '';

    //Alert
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    showAlert: boolean = false;

    onClose(): void {
        this.isClosing = true;
        this.showImport = false; // trigger :leave animation
    }

    onAnimationDone(event: AnimationEvent): void {
        const toState = (event as any).toState;
        if (this.isClosing && toState === 'void') {
            this.close.emit();
            this.isClosing = false;
        }
    }

    constructor(
        private _customerService: CustomerService,
        private CustomerComponent: CustomerComponent,
        private cdr: ChangeDetectorRef,
        private _router: Router,
        private datePipe: DatePipe,
        private _translocoService: TranslocoService,
        private _alertService: AlertService
    ) {}

    files: {
        name: string;
        size: number;
        progress: number;
        status: 'uploading' | 'success';
    }[] = [];

    //Select file upload
    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.uploadFiles(input.files);
            this.someForm.get('dummy')?.setValue('file-selected');
        }
    }

    //Drag and Drop File
    onDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files) {
            this.uploadFiles(event.dataTransfer.files);
            // Nếu bạn dùng reactive form và cần form hợp lệ:
            this.someForm.get('dummy')?.setValue('file-selected'); // hoặc bất kỳ chuỗi nào để đánh dấu đã có file
        }
    }
    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    //Check file upload
    uploadFiles(fileList: FileList) {
        const file = fileList[0]; // Chỉ lấy file đầu tiên

        if (!file) {
            console.log('No file selected');
            return;
        }

        // Kiểm tra kích thước file (20MB = 20 * 1024 * 1024 bytes)
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            this._alertService.showAlert({
                title: this._translocoService.translate(
                    'user_management_import_file.error_title'
                ),
                message: this._translocoService.translate(
                    'user_management_import_file.exceed_size'
                ),
                type: 'error',
            });
            return;
        }

        // Chỉ chấp nhận file .xlsx
        if (!file.name.endsWith('.xlsx')) {
            this._alertService.showAlert({
                title: this._translocoService.translate(
                    'user_management_import_file.error_title'
                ),
                message: this._translocoService.translate(
                    'user_management_import_file.file_accept'
                ),
                type: 'error',
            });
            return;
        }

        // Reset lại danh sách file và selectedFile cũ
        this.selectedFile = file;
        this.files = [];

        const fileData = {
            name: file.name,
            size: Math.ceil(file.size / 1024), // KB
            progress: 0,
            status: 'uploading' as const,
        };

        this.files.push(fileData);
        this.simulateUpload(fileData);
    }

    //Thanh tiến độ upload file
    simulateUpload(file: {
        name: string;
        size: number;
        progress: number;
        status: string;
    }) {
        const interval = setInterval(() => {
            const increment = Math.floor(Math.random() * 10) + 1; // Tăng ngẫu nhiên 1-10 KB
            file.progress = Math.min(file.progress + increment, file.size);

            // Kiểm tra khi tiến trình tải lên hoàn thành
            if (file.progress >= file.size) {
                file.status = 'success'; // Đổi trạng thái thành 'success' khi tải lên hoàn tất
                file.progress = file.size; // Đảm bảo không vượt quá kích thước file
                clearInterval(interval); // Dừng quá trình tải lên
                this.updateFileStatus(file); // Cập nhật giao diện khi hoàn thành
            }
        }, 300); // Cập nhật tiến trình mỗi 300ms
    }

    updateFileStatus(fileData: any) {
        this.cdr.detectChanges(); // Buộc Angular kiểm tra lại giao diện
    }

    removeFile(file: any) {
        this.files = this.files.filter((f) => f !== file);
    }

    //Form kiểm tra step
    someForm = new FormGroup({
        dummy: new FormControl('', Validators.required),
    });

    //Import File
    submitImport() {
        const file = this.selectedFile;

        //Check file
        if (!file) {
            this._alertService.showAlert({
                title: this._translocoService.translate(
                    'user_management_import_file.error_title'
                ),
                message: this._translocoService.translate(
                    'user_management_import_file.excel_accept'
                ),
                type: 'error',
            });
            return;
        }

        //Check form
        if (!this.someForm.valid) {
            this.someForm.markAllAsTouched();
            return;
        }

        const formData = new FormData();
        formData.append('excel_file', file);
        formData.append('sheet_name', 'Template');

        //Call API
        this._customerService.importExcelFile(formData).subscribe(
            (result) => {
                this.uploadTime = this.datePipe.transform(
                    new Date(),
                    'dd/MM/yyyy HH:mm',
                    'GMT+7'
                );

                const bulkResult = result?.data?.bulk_create_result ?? {};
                const validationErrors = result?.data?.validation_errors ?? [];

                const totalCreated = bulkResult.total_created ?? 0;
                const totalSkipped = bulkResult.total_ignored ?? 0;
                const errorLogLink = bulkResult.excel_error_log_download_link
                    ? `${bulkResult.excel_error_log_download_link}`
                    : '';

                this.uploadResult = {
                    added: totalCreated,
                    skipped: totalSkipped,
                };

                this.errorLogDownloadLink = errorLogLink;

                if (totalCreated > 0) {
                    this.uploadStatus = 'success';
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'user_management_import_file.success_title'
                        ),
                        message: this._translocoService.translate(
                            'user_management_import_file.import_success'
                        ),
                        type: 'success',
                    });
                } else {
                    this.uploadStatus = 'error';
                    const errorMessage = this._translocoService.translate(
                        validationErrors.length > 0
                            ? 'user_management_import_file.import_error'
                            : 'user_management_import_file.import_error'
                    );
                    this._alertService.showAlert({
                        title: this._translocoService.translate(
                            'user_management_import_file.error_title'
                        ),
                        message: errorMessage,
                        type: 'error',
                    });
                }

                this.CustomerComponent.loadCustomers();
            },
            (error) => {
                this.uploadResult = { added: 0, skipped: 0 };
                this.uploadStatus = 'error';
                this._alertService.showAlert({
                    title: this._translocoService.translate(
                        'user_management_import_file.error_title'
                    ),
                    message: this._translocoService.translate(
                        'user_management_import_file.error_upload'
                    ),
                    type: 'error',
                });

                this.CustomerComponent.loadCustomers();
            }
        );
    }
}
