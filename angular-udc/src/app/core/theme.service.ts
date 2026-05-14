import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'udc_theme';
  readonly theme = signal<ThemeMode>(this.savedTheme());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    localStorage.setItem(this.storageKey, theme);
    this.apply(theme);
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private savedTheme(): ThemeMode {
    const saved = localStorage.getItem(this.storageKey);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  }

  private apply(theme: ThemeMode): void {
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.style.colorScheme = theme;
  }
}
