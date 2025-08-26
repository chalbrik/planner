import {Component, input} from '@angular/core';
import {IconComponent, IconName, IconSize} from '../icon';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'app-title-display',
  imports: [
    IconComponent,
    MatDivider
  ],
  templateUrl: './title-display.component.html',
  styleUrl: './title-display.component.scss'
})
export class TitleDisplayComponent {

  readonly name = input<string>('');
  readonly iconName = input<IconName>();
  readonly iconSize = input<IconSize>();

}
