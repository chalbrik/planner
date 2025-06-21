import {ChangeDetectionStrategy, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

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
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrl: './employee-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EmployeeFormDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent>);
  addEmployeeForm!: FormGroup;


  constructor(private formBuilder: FormBuilder,) {
  }

  ngOnInit() {
    this.addEmployeeForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
    })

  }

  onAddEmployee() {
    if(this.addEmployeeForm.valid){
      this.dialogRef.close(this.addEmployeeForm.value);
    }
  }

}
