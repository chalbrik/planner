import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {AuthService} from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Planner';

  constructor(private authService: AuthService) {
    setTimeout(() => this.authService.init(), 1000);
  }
}
