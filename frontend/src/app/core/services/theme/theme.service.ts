import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'planner-theme';
  private readonly DEFAULT_THEME: Theme = 'light';

  // Signal przechowujący aktualny motyw
  readonly currentTheme = signal<Theme>(this.DEFAULT_THEME);

  constructor() {
    // Inicjalizacja motywu przy starcie
    this.initTheme();

    // Effect automatycznie aplikuje motyw do body przy każdej zmianie
    effect(() => {
      this.applyThemeToBody(this.currentTheme());
    });
  }

  /**
   * Inicjalizuje motyw przy starcie aplikacji
   * Wczytuje zapisany motyw z localStorage lub używa domyślnego
   */
  initTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = this.getThemeFromStorage();
      if (savedTheme) {
        this.currentTheme.set(savedTheme);
      }
    }
  }

  /**
   * Przełącza między trybem jasnym a ciemnym
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Ustawia konkretny motyw
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.saveThemeToStorage(theme);
  }

  /**
   * Aplikuje motyw do elementu body
   */
  private applyThemeToBody(theme: Theme): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = document.body;

      // Usuń wszystkie klasy motywów
      body.classList.remove('light', 'dark');

      // Dodaj klasę theme-default (schemat kolorów) jeśli jeszcze nie istnieje
      if (!body.classList.contains('theme-default')) {
        body.classList.add('theme-default');
      }

      // Dodaj aktualny motyw (light/dark)
      body.classList.add(theme);
    }
  }

  /**
   * Zapisuje motyw do localStorage
   */
  private saveThemeToStorage(theme: Theme): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.STORAGE_KEY, theme);
      } catch (error) {
        console.error('Nie udało się zapisać motywu do localStorage:', error);
      }
    }
  }

  /**
   * Pobiera motyw z localStorage
   */
  private getThemeFromStorage(): Theme | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return (saved === 'light' || saved === 'dark') ? saved : null;
      } catch (error) {
        console.error('Nie udało się odczytać motywu z localStorage:', error);
        return null;
      }
    }
    return null;
  }
}
