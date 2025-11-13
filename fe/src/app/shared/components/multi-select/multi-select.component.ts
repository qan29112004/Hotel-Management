import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HostListener } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { MultiSelectService } from 'app/core/user/customer/multi-select.service';
import { Subscription } from 'rxjs';
import { CustomerUtils } from 'app/core/user/customer/customer.utils';

@Component({
    selector: 'app-multi-select',
    templateUrl: './multi-select.component.html',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconModule],
    animations: fuseAnimations,
})
export class MultiSelectComponent {
    @Input() disabled: boolean = false;
    @Input() label: string = ''; // label hiển thị
    @Input() required: boolean = false; // có validate required không
    @Input() showError: boolean = false; // kiểm soát việc hiện lỗi
    @Input() options: any[] = [];
    @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
    @Input() selectedOptions: any[] = [];
    @Output() selectedOptionsChange = new EventEmitter<any>();

    private closeSub!: Subscription;
    constructor(
        private _elementRef: ElementRef,
        private _multiSelectService: MultiSelectService
    ) {}

    searchTerm: string = '';
    isDropdownOpen = false;
    blurTimeout: any;
    
    componentId = CustomerUtils.generateUUID();

    ngOnInit() {
        this.closeSub = this._multiSelectService.closeAllDropdowns$.subscribe(
            (exceptId) => {
                if (exceptId !== this.componentId) {
                    this.isDropdownOpen = false;
                }
            }
        );
    }

    ngOnDestroy() {
        this.closeSub.unsubscribe();
    }

    get filteredOptions() {
        const lowerSearch = this.searchTerm?.toLowerCase() || '';
        return (this.options || []).filter(
            (opt) =>
                opt.name?.toLowerCase().includes(lowerSearch) &&
                !(this.selectedOptions || []).find((sel) => sel.id === opt.id)
        );
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!this._elementRef.nativeElement.contains(event.target)) {
            this.isDropdownOpen = false;
        }
    }

    focusInput() {
        this.isDropdownOpen = true;
        setTimeout(() => this.inputRef?.nativeElement?.focus(), 0);
    }

    toggleDropdown(state: boolean) {
        if (state) {
            this._multiSelectService.emitCloseAll(this.componentId);
        }
        this.isDropdownOpen = state;
    }

    selectItem(item: any) {
        clearTimeout(this.blurTimeout);
        this.selectedOptions.push(item);
        this.searchTerm = '';
        this.emitChange();

        setTimeout(() => {
            this.inputRef.nativeElement.focus();
        });
    }

    removeItem(item: { id: number; name: string }) {
        this.selectedOptions = this.selectedOptions.filter(
            (i) => i.id !== item.id
        );
        this.emitChange();
        setTimeout(() => {
            this.inputRef.nativeElement.focus();
        });
    }

    clearSelected() {
        this.selectedOptions = [];
        this.emitChange();
        setTimeout(() => {
            this.inputRef.nativeElement.focus();
        });
    }

    emitChange() {
        this.selectedOptionsChange.emit(this.selectedOptions);
    }
}
