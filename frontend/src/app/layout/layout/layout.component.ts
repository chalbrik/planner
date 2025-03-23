import { Component } from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {FooterComponent} from '../footer/footer.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-layout',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true
})
export class LayoutComponent {

}
