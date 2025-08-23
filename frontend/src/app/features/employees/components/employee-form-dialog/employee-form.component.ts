import {ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatError, MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatNativeDateModule, MatOption, provideNativeDateAdapter} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatDivider} from '@angular/material/divider';
import {CreateEmployeeRequest} from '../../../../core/services/employees/employee.types';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatSelect} from '@angular/material/select';
import {IconComponent} from '../../../../shared/components/icon';
import {MatIcon} from '@angular/material/icon';
import {MatCheckbox} from '@angular/material/checkbox';
import {LocationService} from '../../../../core/services/locations/location.service';
import {Location} from '../../../../core/services/locations/location.types';


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
    MatSuffix,
    MatSelect,
    MatOption,
    IconComponent,
    MatIconButton,
    MatCheckbox,
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
  private readonly locationService = inject(LocationService);

  addEmployeeForm!: FormGroup;

  locations = signal<Location[]>([]);



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

      agreement_type: ['permanent'],
      job: [''],
      hour_rate: [''],
      job_rate: [''],
      contract_date_start: [''],
      contract_date_end: [''],

      locations: this.formBuilder.array([]),
    })

    this.loadLocations();

  }

  onAddEmployee() {
    console.log('Form valid:', this.addEmployeeForm.valid);
    console.log('Form data:', this.addEmployeeForm.getRawValue());
    if (this.addEmployeeForm.valid) {
      const formData = this.addEmployeeForm.getRawValue();

      // ✅ Prosto: popraw daty
      if (formData.birth_date) {
        formData.birth_date = formData.birth_date.toISOString().split('T')[0];
      }

      if (formData.graduation_year) {
        formData.graduation_year = formData.graduation_year.toISOString().split('T')[0];
      }

      if (formData.contract_date_start) {
        formData.contract_date_start = formData.contract_date_start.toISOString().split('T')[0];
      }

      if (formData.contract_date_end) {
        formData.contract_date_end = formData.contract_date_end.toISOString().split('T')[0];
      }

      if (formData.previous_employers) {
        formData.previous_employers.forEach((employer: any) => {
          if (employer.work_date_start) {
            employer.work_date_start = employer.work_date_start.toISOString().split('T')[0];
          }
          if (employer.work_date_end) {
            employer.work_date_end = employer.work_date_end.toISOString().split('T')[0];
          }
        });
      }

      this.employeesService.addEmployee(formData).subscribe({
        next: (newEmployee) => {
          this.snackBar.open('Dodano pracownika!', 'OK', { duration: 3000 });
        },
        error: (error) => {
          console.error('Błąd:', error);
          this.snackBar.open('Błąd!', 'OK', { duration: 3000 });
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
      employer_name: [''],
      employee_position: [''],
      work_date_start: [''],
      work_date_end: ['']
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

private loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (data) => {
      this.locations.set(data)
        console.log("Lokacje: ", data);
      },
      error: (error) => {
        console.error("Błąd ładowania lokacji: ", error);
      }
    })
}

onLocationChange(locationId: string, event: any): void {
    const assignedLocations = this.addEmployeeForm.get('locations') as FormArray;

  if (event.checked) {
    assignedLocations.push(this.formBuilder.control(locationId));
  } else {
    const index = assignedLocations.controls.findIndex(x => x.value === locationId);
    if (index !== -1) {
      assignedLocations.removeAt(index);
    }
  }

}


}
