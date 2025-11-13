// phone-input.component.ts
import { Component, signal, effect, computed, Output, Input, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { CommonModule } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';

interface Country {
  name: string;
  code: string;
  flag: string;
  pattern?: RegExp;
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule, CommonModule,TranslocoModule],
  templateUrl: './phone-input.component.html'
})
export class PhoneInputComponent {
  @Output() phoneNumberEmit = new EventEmitter();
  countries: Country[] = [
    { name: 'Việt Nam', code: '+84', flag: 'vn', pattern: /^[3|5|7|8|9|0]\d{8,9}$/ },
    { name: 'Hoa Kỳ', code: '+1', flag: 'us', pattern: /^\d{10}$/ },
    { name: 'Nhật Bản', code: '+81', flag: 'jp' },
    { name: 'Trung Quốc', code: '+86', flag: 'cn', pattern: /^1[3-9]\d{9}$/ },
    { name: 'Hàn Quốc', code: '+82', flag: 'kr' },
    { name: 'Anh', code: '+44', flag: 'gb', pattern: /^7\d{9}$/ },
    { name: 'Pháp', code: '+33', flag: 'fr', pattern: /^[67]\d{8}$/ },
  ];

  selectedCountry = signal<Country>(this.countries[0]);
  phoneNumber = signal<string>('');
  searchQuery = signal<string>('');
  isDropdownOpen = signal<boolean>(false);
  @Input() isValidSubmit:boolean;

  filteredCountries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.countries.filter(c =>
      c.name.toLowerCase().includes(query) || c.code.includes(query)
    );
  });

  validationMessage = signal<string>('');
  isValid = signal<boolean | null>(null);

  constructor(private translocoService: TranslocoService) {
    effect(() => this.validate(), { allowSignalWrites: true });
  }

  onPhoneNumberChange(value: string) {
    this.phoneNumber.set(value);
    this.phoneNumberEmit.emit(this.phoneNumber())
    this.validate();
  }

  onSearchQueryChange(value: string) {
    this.searchQuery.set(value);
  }

  selectCountry(country: Country) {
    this.selectedCountry.set(country);
    this.isDropdownOpen.set(false);
    this.searchQuery.set('');
    this.validate();
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      setTimeout(() => document.getElementById('country-search')?.focus(), 0);
    }
  }

  validate() {
    const raw = this.phoneNumber();
    const fullNumber = this.selectedCountry().code + raw;

    if (!raw) {
      this.validationMessage.set('');
      this.isValid.set(null);
      return;
    }

    const isValidLib = isValidPhoneNumber(fullNumber);
    const isValidPattern = this.selectedCountry().pattern
      ? this.selectedCountry().pattern.test(raw)
      : true;

    const valid = isValidLib && isValidPattern;

    this.isValid.set(valid);
    this.validationMessage.set(
      valid
        ? this.translocoService.translate('booking.check.valid')
        : this.translocoService.translate('booking.check.invalid')
    );
  }

  get fullPhoneNumber() {
    return this.selectedCountry().code + this.phoneNumber().replace(/\D/g, '');
  }
}