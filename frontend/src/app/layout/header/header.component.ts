import {Component, OnInit} from '@angular/core';
import {User} from '../../core/services/auth.model';
import {AuthService} from '../../core/services/auth.service';
import {Router, RouterModule} from '@angular/router';

import {MatButton} from "@angular/material/button";
import {IconComponent} from '../../shared/components/icon';



@Component({
  selector: 'app-header',
  imports: [RouterModule, MatButton, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    })
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

}
