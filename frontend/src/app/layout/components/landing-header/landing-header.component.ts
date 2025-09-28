import {Component, OnInit, signal} from '@angular/core';
import {IconComponent} from '../../../shared/components/icon';
import {MatButton} from '@angular/material/button';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import {ButtonComponent} from '../../../shared/components/button/button.component';
import {filter} from 'rxjs';

@Component({
  selector: 'app-landing-header',
  imports: [
    RouterLink,
    ButtonComponent
  ],
  templateUrl: './landing-header.component.html',
  styleUrl: './landing-header.component.scss'
})
export class LandingHeaderComponent implements OnInit {
  readonly isLoginPage = signal<boolean>(false);

  constructor(private router: Router) {}

  ngOnInit() {
    // Sprawdź obecny URL
    this.checkCurrentRoute();

    // Nasłuchuj na zmiany tras
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute(): void {
    const currentUrl = this.router.url;
    this.isLoginPage.set(currentUrl.includes('/login'));
  }

}
