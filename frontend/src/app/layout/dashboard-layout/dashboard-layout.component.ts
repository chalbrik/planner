import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LayoutComponent} from '../layout/layout.component';


@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet,
    LayoutComponent
],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  standalone: true,
})
export class DashboardLayoutComponent {

}
