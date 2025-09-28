import { Component } from '@angular/core';
import {ButtonComponent} from '../../../shared/components/button/button.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-landing-home',
  imports: [
    ButtonComponent,
    RouterLink
  ],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss'
})
export class LandingHomeComponent {

}
