// src/app/core/services/scheme.service.ts

import { Injectable } from '@angular/core';
import { SCHEME_STORAGE_KEY, DARK_KEY, LIGHT_KEY } from './scheme.constants';

@Injectable({
  providedIn: 'root',
})
export class SchemeService {
  private currentScheme: 'light' | 'dark' = LIGHT_KEY;

  constructor() {
    const savedScheme = localStorage.getItem(SCHEME_STORAGE_KEY) as 'light' | 'dark' | null;
    if (savedScheme === DARK_KEY || savedScheme === LIGHT_KEY) {
      this.currentScheme = savedScheme;
    } else {
      // Auto detect from OS
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentScheme = prefersDark ? DARK_KEY : LIGHT_KEY;
      localStorage.setItem(SCHEME_STORAGE_KEY, this.currentScheme);
    }

    this.applyScheme();
  }

  /**
   * Get current scheme
   */
  getScheme(): 'light' | 'dark' {
    return this.currentScheme;
  }

  /**
   * Toggle between light/dark
   */
  toggle(): void {
    this.setScheme(this.currentScheme === DARK_KEY ? LIGHT_KEY : DARK_KEY);
  }

  /**
   * Set scheme explicitly
   */
  setScheme(scheme): void {
    this.currentScheme = scheme;
    localStorage.setItem(SCHEME_STORAGE_KEY, scheme);
    this.applyScheme();
  }

  /**
   * Apply to HTML root
   */
  private applyScheme(): void {
    const html = document.documentElement;
    html.setAttribute('data-theme', this.currentScheme);

    // Optional: apply class instead
    html.classList.remove(LIGHT_KEY, DARK_KEY);
    html.classList.add(this.currentScheme);
  }
}
