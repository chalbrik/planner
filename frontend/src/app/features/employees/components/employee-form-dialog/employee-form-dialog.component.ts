import {ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatHint, MatInput, MatLabel} from '@angular/material/input';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatSelect} from '@angular/material/select';
import {MatOption, provideNativeDateAdapter} from '@angular/material/core';
import {
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  MatEndDate,
  MatStartDate
} from '@angular/material/datepicker';


interface Agreemnet {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-employee-form-dialog',
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
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
    MatHint,
    MatStartDate,
    MatEndDate
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrl: './employee-form-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeFormDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent>);

  private readonly formBuilder = inject(FormBuilder);

  addEmployeeForm!: FormGroup;

  agreemnetsTypeValues: Agreemnet[] = [
    {value: 'steak-0', viewValue: 'Umowa o prace'},
    {value: 'pizza-1', viewValue: 'Umowa na zlecenie'},
  ];


  constructor() {
  }

  ngOnInit() {
    this.addEmployeeForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required,  Validators.email]],
      phone: ['', Validators.required],
      agreementType: ['', Validators.required],
      hourlyRate: ['', Validators.required],
      workStart: ['', Validators.required],
      workEnd: ['', Validators.required],
    })

  }

  onAddEmployee() {
    console.log("Hello", this.addEmployeeForm.getRawValue());
    if(this.addEmployeeForm.valid){

      console.log(this.addEmployeeForm.value);
      this.dialogRef.close(this.addEmployeeForm.value);
    }
  }


}
