import {Component, inject} from '@angular/core';
import {ButtonComponent} from '../../../shared/components/button/button.component';
import {MatButton} from '@angular/material/button';
import {ScheduleService} from '../../../core/services/schedule/schedule.service';

@Component({
  selector: 'app-landing-home',
  imports: [
    ButtonComponent,
    MatButton,
  ],
  templateUrl: './landing-home.component.html',
  styleUrl: './landing-home.component.scss'
})
export class LandingHomeComponent {


}
