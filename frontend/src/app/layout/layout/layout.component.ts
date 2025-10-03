import {Component, OnInit, ViewChild} from '@angular/core';
import {HeaderComponent} from '../components/header/header.component';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {MatButton} from '@angular/material/button';
import {IconComponent} from '../../shared/components/icon';
import {AuthService} from '../../core/services/auth.service';
import {Router, RouterModule} from '@angular/router';
import {User} from '../../core/services/auth.model';

@Component({
  selector: 'app-layout',
  imports: [
    HeaderComponent,
    MatSidenavModule,
    MatButton,
    IconComponent,
    RouterModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true
})
export class LayoutComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
