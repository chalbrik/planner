import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  standalone: true
})
export class FooterComponent implements OnInit {
  currentYear!: number;

  ngOnInit() {
    this.currentYear = new Date().getFullYear();
  }

}
