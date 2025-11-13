import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoService } from '@ngneat/transloco';
import LoginHistory from 'app/core/admin/user-management/login-history.type';
import { UserManagementService } from 'app/core/admin/user-management/user-management.service';
import { User } from 'app/core/admin/user-management/user-management.types';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-login-history',
    standalone: true,
    templateUrl: './login-history.component.html',
    styleUrl: './login-history.component.scss',
    imports: [CommonModule, MatIconModule],
})
export class LoginHistoryComponent implements OnInit, OnDestroy {
    @Input() show = false;
    @Input() user: User | null = null;
    @Output() close = new EventEmitter<void>();
    loginHistory: LoginHistory[] = [];
    loading = false;
    offset = 0;
    limit = 10;
    total = 0;
    private destroy$ = new Subject<void>();

    constructor(
        private _userManagementService: UserManagementService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit() {
        // Load login history when component initializes and user is provided
        if (this.user && this.show) {
            this.loadLoginHistory();
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Watch for changes in show/user inputs
    ngOnChanges() {
        if (this.show && this.user) {
            this.loadLoginHistory();
        } else if (!this.show) {
            this.resetData();
        }
    }

    loadLoginHistory() {
        if (!this.user) return;

        this.loading = true;

        // Call API to get login history
        this._userManagementService
            .getLoginHistory(this.user, this.offset, this.limit)
            .subscribe((res) => {
                this.loginHistory = [...this.loginHistory, ...res.result]; // append thêm
                this.total = res.total;
                this.loading = false;
            });
    }

    closePopup() {
        this.close.emit();
    }

    onBackdropClick(event: Event) {
        if (event.target === event.currentTarget) {
            this.closePopup();
        }
    }

    stopPropagation(event: Event) {
        event.stopPropagation();
    }

    private resetData() {
        this.loginHistory = [];
        this.loading = false;
        this.offset = 0;
        this.total = 0;
    }

    // Helper method to get device icon
    getDeviceIcon(device: string): string {
        if (!device) return 'device_unknown';

        const deviceLower = device.toLowerCase();
        if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
            return 'smartphone';
        } else if (deviceLower.includes('tablet')) {
            return 'tablet';
        } else {
            return 'computer';
        }
    }

    // Helper method to format date time
    formatDateTime(dateTime: string): string {
        if (!dateTime) return '---';

        // Implement your date formatting logic here
        // Example using Date
        const date = new Date(dateTime);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    // Translation helper
    t(key: string): string {
        return this._translocoService.translate(key);
    }

    loadMoreHistory() {
        // Implement pagination logic here
        if (this.loginHistory.length >= this.total) return; // Không còn gì để load

        this.offset += this.limit;
        this.loadLoginHistory();
    }
}
