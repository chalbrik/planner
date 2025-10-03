import {Component, Input, Output, EventEmitter, input, output} from '@angular/core';
import {User} from '../../../core/services/auth.model';
import {RouterModule} from '@angular/router';
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatDrawer} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {IconComponent} from '../../../shared/components/icon';

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    MatButton,
    MatIconModule,
    IconComponent,
    MatIconButton
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent {
  drawer = input.required<MatDrawer>();
  currentUser = input<User | null>(null);
  logoutEvent = output<void>();

  onLogout() {
    this.logoutEvent.emit();
  }
}
