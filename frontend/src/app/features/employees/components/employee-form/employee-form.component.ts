import {ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors, ValidatorFn,
  Validators
} from '@angular/forms';
import {MAT_DATE_LOCALE, MatNativeDateModule, MatOptionModule, provideNativeDateAdapter} from '@angular/material/core';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCheckbox} from '@angular/material/checkbox';
import {LocationService} from '../../../../core/services/locations/location.service';
import {Location} from '../../../../core/services/locations/location.types';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {TitleDisplayComponent} from '../../../../shared/components/title-display/title-display.component';
import {MatStep, MatStepLabel, MatStepper, MatStepperPrevious} from '@angular/material/stepper';
import {ButtonComponent} from '../../../../shared/components/button/button.component';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Employee } from '../../../../core/services/employees/employee.types';
import {MatError, MatFormField, MatInput, MatInputModule, MatLabel} from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {IconComponent} from '../../../../shared/components/icon';

@Component({
  selector: 'app-employee-form',
  imports: [
    MatButton,
    ReactiveFormsModule,
    FormsModule,
    MatNativeDateModule,
    MatCheckbox,
    MatOptionModule,
    TitleDisplayComponent,
    MatStepper,
    MatStep,
    MatStepLabel,
    MatStepperPrevious,
    ButtonComponent,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelect,
    IconComponent,
  ],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
  providers: [  provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeFormComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly employeesService = inject(EmployeesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locationService = inject(LocationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  hasSelectedLocations = signal<boolean>(false);

  private readonly data = inject<Employee | null>(MAT_BOTTOM_SHEET_DATA, { optional: true });

  @ViewChild('employerStepper') employerStepper!: MatStepper;

  // Flagi dla zapobiegania podwójnym wywołaniom (workaround dla MatBottomSheet)
  addEmployeeForm!: FormGroup;

  locations = signal<Location[]>([]);

  agreementType = signal<string>('');

  schoolTypeOptions = [
    { value: 'basic_vocational', label: 'Zasadnicza lub inna równorzędna szkoła zawodowa' },
    { value: 'secondary_vocational', label: 'Średnia szkoła zawodowa' },
    { value: 'secondary_vocational_graduates', label: 'Średnia szkoła zawodowa dla absolwentów zasadniczych i równorzędnych szkół zawodowych' },
    { value: 'secondary_general', label: 'Średnia szkoła ogólnokształcąca' },
    { value: 'post_secondary', label: 'Szkoła policealna' },
    { value: 'higher_education', label: 'Szkoła wyższa' }
  ];

  contractTypeOptions = [
    { value: 'permanent', label: 'Umowa o pracę' },
    { value: 'contract', label: 'Umowa cywilno-prawna' }
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
      agreement_type: ['', Validators.required],
      job: [''],
      hour_rate: [''],
      job_rate: [''],
      contract_date_start: [''],
      contract_date_end: [''],

      locations: this.formBuilder.array([], this.atLeastOneLocationValidator()),
    })

    this.addEmployeeForm.get('agreement_type')?.valueChanges.subscribe(value => {
      this.agreementType.set(value);
    });

    if (this.data) {
      this.addEmployeeForm.patchValue({
        full_name: this.data.full_name,
        birth_date: this.data.birth_date ? new Date(this.data.birth_date) : null,
        phone: this.data.phone,
        email: this.data.email,
        school_type: this.data.school?.school_type || '',
        school_name: this.data.school?.school_name || '',
        graduation_year: this.data.school?.graduation_year ? new Date(this.data.school.graduation_year) : null,
        agreement_type: this.data.agreement_type,
        job: this.data.job,
        hour_rate: this.data.hour_rate,
        job_rate: this.data.job_rate,
        contract_date_start: this.data.contract_date_start ? new Date(this.data.contract_date_start) : null,
        contract_date_end: this.data.contract_date_end ? new Date(this.data.contract_date_end) : null,
      });
    }

    this.loadLocations();

  }

  onAddEmployee() {
    //ta metoda jest do edycji - czyli trzeba bedzie ja przejzec i uproscic

    if (this.addEmployeeForm.invalid) {
      // Oznacz wszystkie pola jako touched, żeby pokazać błędy
      this.addEmployeeForm.markAllAsTouched();
      this.snackBar.open('Wypełnij wszystkie wymagane pola!', 'OK', { duration: 3000 });
      return; // Przerwij wysyłanie
    }

    const formData = this.addEmployeeForm.getRawValue();

    // ✅ Formatuj daty lub usuń pole jeśli puste
    if (formData.birth_date) {
      formData.birth_date = this.formatDateToLocal(formData.birth_date);
    } else {
      delete formData.birth_date;
    }

    if (formData.graduation_year) {
      formData.graduation_year = this.formatDateToLocal(formData.graduation_year);
    } else {
      delete formData.graduation_year;
    }

    if (formData.contract_date_start) {
      formData.contract_date_start = this.formatDateToLocal(formData.contract_date_start);
    } else {
      delete formData.contract_date_start;
    }

    if (formData.contract_date_end) {
      formData.contract_date_end = this.formatDateToLocal(formData.contract_date_end);
    } else {
      delete formData.contract_date_end;
    }

    // ✅ Filtruj i formatuj pracodawców
    if (formData.previous_employers && formData.previous_employers.length > 0) {
      formData.previous_employers = formData.previous_employers
        .filter((employer: any) => {
          // Zostaw tylko wypełnionych pracodawców
          return employer.employer_name ||
            employer.employee_position ||
            employer.work_date_start ||
            employer.work_date_end;
        })
        .map((employer: any) => {
          const cleanEmployer: any = {};

          // Dodaj tylko niepuste pola
          if (employer.employer_name) cleanEmployer.employer_name = employer.employer_name;
          if (employer.employee_position) cleanEmployer.employee_position = employer.employee_position;

          if (employer.work_date_start) {
            cleanEmployer.work_date_start = employer.work_date_start.toISOString().split('T')[0];
          }

          if (employer.work_date_end) {
            cleanEmployer.work_date_end = employer.work_date_end.toISOString().split('T')[0];
          }

          return cleanEmployer;
        });

      // Jeśli po filtracji nie ma pracodawców, usuń pole
      if (formData.previous_employers.length === 0) {
        delete formData.previous_employers;
      }
    } else {
      delete formData.previous_employers;
    }

    // ✅ Usuń puste pola tekstowe (ale zostaw liczby i booleany)
    // Object.keys(formData).forEach(key => {
    //   const value = formData[key];
    //   if (value === '' || value === null || value === undefined) {
    //     delete formData[key];
    //   }
    // });

    console.log("Wysłane dane:", formData);

    const isEditMode = this.data !== null;

    if (isEditMode) {
      // EDYCJA - aktualizuj istniejącego pracownika
      this.employeesService.updateEmployee(this.data!.id, formData).subscribe({
        next: (updatedEmployee) => {
          this.snackBar.open('Zaktualizowano pracownika!', 'OK', { duration: 3000 });
          this.bottomSheet.dismiss(updatedEmployee);
        },
        error: (error) => {
          console.error('Błąd:', error);
          this.snackBar.open('Błąd aktualizacji!', 'OK', { duration: 3000 });
        }
      });
    } else {
      // TWORZENIE - dodaj nowego pracownika
      this.employeesService.addEmployee(formData).subscribe({
        next: (newEmployee) => {
          this.snackBar.open('Dodano pracownika!', 'OK', { duration: 3000 });
          this.bottomSheet.dismiss(newEmployee);
        },
        error: (error) => {
          console.error('Błąd:', error);
          this.snackBar.open('Błąd dodawania!', 'OK', { duration: 3000 });
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

  // Obsługuje kliknięcie "Następny" - dodaje nowego pracodawcę jeśli to ostatni krok
  handleNextStep(currentIndex: number): void {
    const isLastStep = currentIndex === this.previousEmployers.length - 1;

    if (isLastStep) {
      // Jeśli to ostatni krok, dodaj nowego pracodawcę
      this.addEmployer();

      // Przejdź do nowo dodanego kroku po krótkiej przerwie
      setTimeout(() => {
        this.employerStepper.selectedIndex = currentIndex + 1;
      }, 300);
    } else {
      // Jeśli nie ostatni, przejdź do następnego istniejącego kroku
      this.employerStepper.next();
    }
  }

// Dodaje nowego pracodawcę
  addEmployer(): void {
    this.previousEmployers.push(this.createEmployerGroup());
  }

  removeEmployer(index: number): void {
    this.previousEmployers.removeAt(index);

    // Opcjonalnie: wróć do poprzedniego kroku jeśli usunęliśmy aktualny
    if (this.employerStepper.selectedIndex >= this.previousEmployers.length) {
      this.employerStepper.previous();
    }
  }

  removeCurrentEmployer(): void {
    const currentIndex = this.employerStepper.selectedIndex;
    this.removeEmployer(currentIndex);
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];  // YYYY-MM-DD
  }

  private loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (data) => {
        this.locations.set(data);

        // Jeśli edycja - załaduj przypisane lokalizacje
        if (this.data && this.data.locations) {
          const locationsArray = this.addEmployeeForm.get('locations') as FormArray;
          locationsArray.clear(); // Wyczyść najpierw

          this.data.locations.forEach(locationId => {
            locationsArray.push(this.formBuilder.control(locationId));
          });

          this.hasSelectedLocations.set(locationsArray.length > 0);
        }
      },
      error: (error) => {
        // console.error("Błąd ładowania lokacji: ", error);
      }
    })
  }
  //
  // onLocationChange(locationId: string, event: any): void {
  //   const assignedLocations = this.addEmployeeForm.get('locations') as FormArray;
  //
  //   if (event.checked) {
  //     assignedLocations.push(this.formBuilder.control(locationId));
  //   } else {
  //     const index = assignedLocations.controls.findIndex(x => x.value === locationId);
  //     if (index !== -1) {
  //       assignedLocations.removeAt(index);
  //     }
  //   }
  //
  // }

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

    // ✅ Aktualizuj signal
    this.hasSelectedLocations.set(assignedLocations.length > 0);
  }

  isLocationSelected(locationId: string): boolean {
    const assignedLocations = this.addEmployeeForm.get('locations') as FormArray;
    return assignedLocations.controls.some(control => control.value === locationId);
  }

  getErrorMessage(controlName: string): string {
    const control = this.addEmployeeForm.get(controlName);

    if (control?.errors) {
      return 'Pole obowiązkowe';
    }

    return '';
  }

  shouldShowError(controlName: string): boolean {
    const control = this.addEmployeeForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  onCancel(): void {
    this.bottomSheet.dismiss();
  }

  private formatDateToLocal(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private atLeastOneLocationValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;
      return formArray.length > 0 ? null : { 'noLocation': true };
    };
  }

  shouldShowLocationError(): boolean {
    const locationsArray = this.addEmployeeForm.get('locations') as FormArray;
    return locationsArray.touched && locationsArray.invalid;
  }

}
