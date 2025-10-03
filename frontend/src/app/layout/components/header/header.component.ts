import { Component, OnInit, input, output, inject, computed } from '@angular/core';
import { User } from '../../../core/services/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { IconComponent } from '../../../shared/components/icon';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-header',
  imports: [RouterModule, MatButton, MatIconButton, MatIcon, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  // Inputs
  readonly drawer = input<MatDrawer>();
  readonly currentUser = input<User | null>(null);

  // Outputs
  readonly logoutEvent = output<void>();

  // Computed signal dla ikony motywu
  readonly themeIcon = computed(() => {
    return this.themeService.currentTheme() === 'light' ? 'moon' : 'sun';
  });

  // Computed signal dla aria-label
  readonly themeAriaLabel = computed(() => {
    return this.themeService.currentTheme() === 'light'
      ? 'Przełącz na tryb ciemny'
      : 'Przełącz na tryb jasny';
  });

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      // Możesz dodać dodatkową logikę jeśli potrzeba
    });
  }

  onLogout(): void {
    this.logoutEvent.emit();
  }

  toggleTheme(): void {
    console.log('Toggle clicked! Current theme:', this.themeService.currentTheme());
    this.themeService.toggleTheme();
    console.log('After toggle:', this.themeService.currentTheme());
  }
}
