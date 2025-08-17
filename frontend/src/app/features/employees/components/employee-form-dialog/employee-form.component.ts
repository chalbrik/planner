import {ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatDivider} from '@angular/material/divider';
import {CreateEmployeeRequest} from '../../../../core/services/employees/employee.types';
import {MatSnackBar} from '@angular/material/snack-bar';


interface Agreemnet {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-employee-form-dialog',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerToggle,
    MatDivider,
    MatDatepickerInput,
    MatDatepicker,
    MatError,
    MatNativeDateModule,
    MatSuffix
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeFormComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly employeesService = inject(EmployeesService);
  private readonly snackBar = inject(MatSnackBar);

  addEmployeeForm!: FormGroup;

  agreemnetsTypeValues: Agreemnet[] = [
    {value: 'permanent', viewValue: 'Umowa o prace'},
    {value: 'contract', viewValue: 'Umowa na zlecenie'},
  ];


  constructor() {
  }

  ngOnInit() {
    this.addEmployeeForm = this.formBuilder.group({

      //Pola wypełniane przez pracownika

      full_name: ['', Validators.required],
      birth_date: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required,  Validators.email]],

      school_type: [''],
      school_name: [''],
      graduation_year: [''],

      previous_employers: this.formBuilder.array([]),

      //JESZCZE TRZEBA DODAC NIEPELNOSPRAWNOSIC I KP-188 ALE TO POZNIEJ, NA RAZIE ZOSTAW


      //Pola wypełniane przez kierownika

      agreement_type: [''],
      hourlyRate: [''],
      workStart: [''],
      workEnd: [''],
    })

  }

  onAddEmployee() {
    console.log("Dane formularza:", this.addEmployeeForm.getRawValue());

    if (this.addEmployeeForm.valid) {
      const formData = this.addEmployeeForm.getRawValue() as CreateEmployeeRequest;

      this.employeesService.addEmployee(formData).subscribe({
        next: (newEmployee) => {
          // Pokaż sukces
          this.snackBar.open('Pracownik został dodany pomyślnie!', 'Zamknij', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          console.error('Błąd podczas dodawania pracownika:', error);
          // Pokaż błąd
          this.snackBar.open(
            `Błąd: ${error.error?.detail || 'Nie udało się dodać pracownika'}`,
            'Zamknij',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  // Getter do łatwego dostępu do FormArray
  get previousEmployers() {
    return this.addEmployeeForm.get('previous_employers') as FormArray;
  }

// Tworzy nową grupę pól dla pracodawcy
  private createEmployerGroup(): FormGroup {
    return this.formBuilder.group({
      previous_employer: [''],
      previous_position: [''],
      previous_working_period_start: [''],
      previous_working_period_end: ['']
    });
  }

// Dodaje nowego pracodawcę
  addEmployer(): void {
    this.previousEmployers.push(this.createEmployerGroup());
  }

// Usuwa pracodawcę po indeksie
  removeEmployer(index: number): void {
    this.previousEmployers.removeAt(index);
  }

private formatDate(date: Date): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];  // YYYY-MM-DD
}


}
