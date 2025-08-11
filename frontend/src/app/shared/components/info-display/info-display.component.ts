import {Component, input} from '@angular/core';
import {IconComponent, IconName, IconSize} from '../icon';

@Component({
  selector: 'app-info-display',
  imports: [
    IconComponent
  ],
  templateUrl: './info-display.component.html',
  styleUrl: './info-display.component.scss'
})
export class InfoDisplayComponent {
  readonly name = input<string>();
  readonly data = input<string>();
  readonly iconName = input<IconName>();
  readonly iconSize = input<IconSize>();

}
