import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { AlertService } from 'app/core/alert/alert.service';
import { forkJoin } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delete-user',
  standalone: true,
  imports: [CommonModule, TranslocoModule, MatIconModule],
  templateUrl: './delete-user.component.html',
})
export class DeleteUserComponent {
  @Input() userId?: number;
  @Input() userIds?: number[];
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  isDeleting = false;

  constructor(
    private userService: UserManagementService,
    private alertService: AlertService,
    private transloco: TranslocoService
    
  ) {}

  get idsToDelete(): number[] {
    if (this.userIds?.length) return this.userIds;
    if (this.userId != null) return [this.userId];
    return [];
  }

  delete(): void {
    if (this.isDeleting) return;
    if (this.idsToDelete.length === 0) return;

    this.isDeleting = true;

    const deleteRequests = this.idsToDelete.map(id =>
      this.userService.deleteUser(id)
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.alertService.showAlert({
          type: 'success',
          title: this.transloco.translate('other.success_title'),
          message: this.transloco.translate('success.CM_S_011', {
            count: this.idsToDelete.length
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
      }
    });
  }

  cancel(): void {
    this.close.emit();
  }
}
