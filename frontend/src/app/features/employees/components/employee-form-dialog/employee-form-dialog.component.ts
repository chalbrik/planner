import {ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSelect} from '@angular/material/select';
import {MatNativeDateModule, MatOption, provideNativeDateAdapter} from '@angular/material/core';
import {
  MatDatepicker, MatDatepickerActions, MatDatepickerApply, MatDatepickerCancel,
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  MatEndDate,
  MatStartDate
} from '@angular/material/datepicker';
import {environment} from '../../../../../environments/environment';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatDivider} from '@angular/material/divider';
import {MatHint} from '@angular/material/form-field';
import {MatIcon} from '@angular/material/icon';


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
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
    FormsModule,
    MatDateRangeInput,
    MatDatepickerToggle,
    MatDateRangePicker,
    MatStartDate,
    MatEndDate,
    MatDivider,
    MatDatepickerInput,
    MatDatepicker,
    MatDatepickerActions,
    MatDatepickerCancel,
    MatDatepickerApply,
    MatHint,
    MatError,
    MatNativeDateModule,
    MatIcon,
    MatSuffix
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrl: './employee-form-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeFormDialogComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly employeesService = inject(EmployeesService)

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

      first_name: ['', Validators.required],
      second_name: [''],
      last_name: ['', Validators.required],
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
    console.log("Hello", this.addEmployeeForm.getRawValue());
    console.log('Current API URL:', environment.apiUrl);
    if(this.addEmployeeForm.valid){

      this.employeesService.addEmployee(this.addEmployeeForm.value).subscribe({
        next: (newEmployee) => {
          // Dodaj do dataSource
          // const currentData = this.dataSource.data;
          // this.dataSource.data = [...currentData, newEmployee];
          console.log("Nowy pracownik", newEmployee);
        },
        error: (error) => {
          console.error('Błąd podczas dodawania pracownika: ', error);
        }
      });

      console.log(this.addEmployeeForm.value);
    }
  }

  // Getter do łatwego dostępu do FormArray
  get previousEmployers() {
    return this.addEmployeeForm.get('previous_employers') as FormArray;
  }

// Tworzy nową grupę pól dla pracodawcy
  private createEmployerGroup(): FormGroup {
    return this.formBuilder.group({
      previous_employer: ['', Validators.required],
      previous_position: ['', Validators.required],
      previous_working_period_start: ['', Validators.required],
      previous_working_period_end: ['', Validators.required]
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


}
