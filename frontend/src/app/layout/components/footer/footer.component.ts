import {Component, OnInit} from '@angular/core';


@Component({
  selector: 'app-footer',
  imports: [],
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
