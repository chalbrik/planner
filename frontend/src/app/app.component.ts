import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Planner';

  // Inject ThemeService aby zainicjalizować motyw przy starcie aplikacji
  private readonly themeService = inject(ThemeService);

  constructor() {
    // ThemeService automatycznie inicjalizuje motyw w konstruktorze
    // i aplikuje go do <body> przez effect()
  }
}
