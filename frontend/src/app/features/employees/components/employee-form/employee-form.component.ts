import {ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatNativeDateModule, MatOptionModule, provideNativeDateAdapter} from '@angular/material/core';
import {EmployeesService} from '../../../../core/services/employees/employees.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCheckbox} from '@angular/material/checkbox';
import {LocationService} from '../../../../core/services/locations/location.service';
import {Location} from '../../../../core/services/locations/location.types';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {InputComponent} from '../../../../shared/components/input/input.component';
import {DateInputComponent} from '../../../../shared/components/date-input/date-input.component';
import {SelectInputComponent} from '../../../../shared/components/select-input/select-input.component';
import {TitleDisplayComponent} from '../../../../shared/components/title-display/title-display.component';
import {MatStep, MatStepLabel, MatStepper, MatStepperPrevious} from '@angular/material/stepper';
import {ButtonComponent} from '../../../../shared/components/button/button.component';
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


@Component({
  selector: 'app-employee-form',
  imports: [
    MatButton,
    ReactiveFormsModule,
    FormsModule,
    MatNativeDateModule,
    MatCheckbox,
    InputComponent,
    DateInputComponent,
    SelectInputComponent,
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
  private readonly bottomSheet = inject(MatBottomSheet);

  @ViewChild('employerStepper') employerStepper!: MatStepper;

  // Flagi dla zapobiegania podwójnym wywołaniom (workaround dla MatBottomSheet)
  private isSubmitting = false;
  private isCancelling = false;

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

      agreement_type: [''],
      job: [''],
      hour_rate: [''],
      job_rate: [''],
      contract_date_start: [''],
      contract_date_end: [''],

      locations: this.formBuilder.array([]),
    })

    this.addEmployer();

    this.loadLocations();

    this.addEmployeeForm.get('agreement_type')?.valueChanges.subscribe(value => {
      this.agreementType.set(value);
    });

  }

  onAddEmployee() {
    // Sprawdź czy już się wykonuje (workaround dla MatBottomSheet double event)
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
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
          this.isSubmitting = false; // Reset flagi
          this.snackBar.open('Dodano pracownika!', 'OK', { duration: 3000 });
          this.bottomSheet.dismiss(newEmployee);
        },
        error: (error) => {
          this.isSubmitting = false; // Reset flagi
          console.error('Błąd:', error);
          this.snackBar.open('Błąd!', 'OK', { duration: 3000 });
        }
      });
    } else {
      this.isSubmitting = false; // Reset flagi jeśli formularz niepoprawny
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
    // Nie pozwalaj usunąć ostatniego pracodawcy - zawsze musi zostać przynajmniej jeden
    if (this.previousEmployers.length <= 1) {
      this.snackBar.open('Musi zostać przynajmniej jeden pracodawca', 'OK', { duration: 3000 });
      return;
    }

    this.previousEmployers.removeAt(index);
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
        this.locations.set(data)
        // console.log("Lokacje: ", data);
      },
      error: (error) => {
        // console.error("Błąd ładowania lokacji: ", error);
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
    // Sprawdź czy już się wykonuje (workaround dla MatBottomSheet double event)
    if (this.isCancelling) {
      return;
    }

    this.isCancelling = true;
    this.bottomSheet.dismiss();
  }

}
