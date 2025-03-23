import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LayoutComponent} from '../layout/layout.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet,
    LayoutComponent,
    CommonModule
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  standalone: true,
})
export class DashboardLayoutComponent {

}
