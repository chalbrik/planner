import { Component, OnInit, inject, computed } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { FooterComponent } from '../components/footer/footer.component';
import { MatDrawer, MatDrawerContainer, MatDrawerContent } from '@angular/material/sidenav';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { IconComponent } from '../../shared/components/icon';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/services/auth.model';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme/theme.service';

@Component({
  selector: 'app-layout',
  imports: [
    HeaderComponent,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    RouterLink,
    RouterLinkActive,
    MatButton,
    MatIconButton,
    IconComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true
})
export class LayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  currentUser: User | null = null;

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
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  toggleTheme(): void {
    console.log('Toggle clicked! Current theme:', this.themeService.currentTheme());
    this.themeService.toggleTheme();
    console.log('After toggle:', this.themeService.currentTheme());
  }
}
