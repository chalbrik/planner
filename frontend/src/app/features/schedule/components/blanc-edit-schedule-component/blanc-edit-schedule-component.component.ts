import { Component } from '@angular/core';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-blanc-edit-schedule-component',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle
  ],
  templateUrl: './blanc-edit-schedule-component.component.html',
  styleUrl: './blanc-edit-schedule-component.component.scss'
})
export class BlancEditScheduleComponentComponent {

}
