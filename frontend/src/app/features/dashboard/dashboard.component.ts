import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
  imports: []
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }
}
