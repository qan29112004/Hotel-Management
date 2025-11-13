import { Component, computed, signal ,OnInit, OnDestroy, Output, Input, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';
import countries from 'world-countries';
import { TranslocoService } from '@ngneat/transloco';
import { TranslocoModule } from '@ngneat/transloco';
import { FormsModule } from '@angular/forms';
import { Subject, pipe, debounceTime, takeUntil } from 'rxjs';
interface Country{
  name:string,
  code:string
}
@Component({
  selector: 'app-select-country',
  standalone: true,
  imports: [CommonModule, TranslocoModule, FormsModule],
  templateUrl: './select-country.component.html',
  styles: ``
})

export class SelectCountryComponent implements OnInit, OnDestroy {
  listCountry = countries.map(c => ({ name: c.name.native?.vie?.common || c.name.common, code: c.cca2 }))
  searchText = '';
  selectedCountry = signal<Country>({name:'Việt Nam', code:'VN'});
  phoneNumber = signal<string>('');
  searchQuery = signal<string>('');
  isDropdownOpen = signal<boolean>(false);
  @Output() countryName = new EventEmitter<string>();
  @Input() isValidSubmit:boolean;

  private debounceSearch = new Subject<string>();
  private destroy = new Subject<any>();

  filteredCountries = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.listCountry.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.countryName.emit(this.selectedCountry().name)
    this.debounceSearch.pipe(
      debounceTime(300),
      takeUntil(this.destroy)
    ).subscribe(data=>{
      this.searchQuery.set(data)
    })
  }

  ngOnDestroy(): void {
    this.destroy.next('');
    this.destroy.complete();
  }

  constructor(private translocoService: TranslocoService) {
  }


  onSearchQueryChange(value: string) {
    this.debounceSearch.next(value);
  }

  selectCountry(country: Country) {
    this.selectedCountry.set(country);
    this.countryName.emit(this.selectedCountry().name)
    this.isDropdownOpen.set(false);
    this.searchQuery.set('');
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      setTimeout(() => document.getElementById('country-search')?.focus(), 0);
    }
  }

  // filteredCountries() {
  //   const term = this.searchText.toLowerCase();
  //   return this.listCountry.filter(c => c.name.toLowerCase().includes(term));
  // }
}
