import { Component } from '@angular/core';
import {HeaderComponent} from '../components/header/header.component';
import {LandingHeaderComponent} from '../components/landing-header/landing-header.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-landing-layout',
  imports: [
    LandingHeaderComponent,
    RouterOutlet
  ],
  templateUrl: './landing-layout.component.html',
  styleUrl: './landing-layout.component.scss'
})
export class LandingLayoutComponent {

}
