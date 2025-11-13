import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Observable, of } from 'rxjs';
import { AlertService } from 'app/core/alert/alert.service';

@Component({
    selector: 'app-generic-delete',
    standalone: true,
    imports: [CommonModule, TranslocoModule, MatIconModule],
    templateUrl: './generic-delete.component.html',
})
export class GenericDeleteComponent {
    @Input() entityIds: (number | string)[] = [];
    @Input() titleKey: string = 'content.confirm_delete';
    @Input() messageKey: string = 'common.delete_confirm_message';
    @Input() warningKey: string | null = null;
    @Input() deleteHandler: (id: string) => Observable<any> = () => of(null);
    @Output() close = new EventEmitter<void>();
    @Output() refresh = new EventEmitter<void>();

    isDeleting = false;

    constructor(
        private alertService: AlertService,
        private transloco: TranslocoService
    ) {}

    delete(): void {
        if (this.isDeleting || this.entityIds.length === 0) return;

        this.isDeleting = true;

        const deleteRequests = this.entityIds.map((id:string) => this.deleteHandler(id));

        forkJoin(deleteRequests).subscribe({
            next: () => {
                this.alertService.showAlert({
                    type: 'success',
                    title: this.transloco.translate('other.success_title'),
                    message: this.transloco.translate('success.CM_S_011', {
                        count: this.entityIds.length,
                    }),
                });

                setTimeout(() => {
                    this.refresh.emit();
                    this.close.emit();
                }, 1000);
            },
            error: () => {
                this.alertService.showAlert({
                    type: 'error',
                    title: this.transloco.translate('errors.default'),
                    message: this.transloco.translate('errors.default'),
                });
                this.isDeleting = false;
            },
        });
    }

    cancel(): void {
        this.close.emit();
    }
}