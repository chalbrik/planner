import { Component } from '@angular/core';
import {ButtonComponent} from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-landing-home',
  imports: [
    ButtonComponent,
  ],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss'
})
export class LandingHomeComponent {

}
