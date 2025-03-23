import {Component, OnInit} from '@angular/core';
import {ScheduleService} from '../../core/services/schedule.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
  standalone: true,
})
export class ScheduleComponent implements OnInit {
  employees: any[] = [];
  workHours: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit() {
  this.loadEmployees();
  this.loadWorkHours();

    console.log("Pracownicy: ", this.employees);
    console.log("Godziny pracy: ", this.workHours);
  }

  loadEmployees(){
    this.isLoading = true;
    this.scheduleService.getEmployees().subscribe({
        next: (data) => {
          this.employees = data;
          this.isLoading = false;
        },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować pracowników';
        this.isLoading = false;
        console.error('Błąd ładowania pracowników: ', error);
      },
    });
  }

  loadWorkHours(): void {
    this.isLoading = true;
    this.scheduleService.getWorkHours().subscribe({
      next: (data) => {
        this.workHours = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Nie udało się załadować harmonogramu';
        this.isLoading = false;
        console.error('Błąd ładowania harmonogramu:', error);
      }
    });
  }
}
