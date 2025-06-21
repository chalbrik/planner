import {Component, computed, Input, OnInit, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTimepickerModule, MatTimepickerOption} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ScheduleService} from '../../../../core/services/schedule/schedule.service';
import {Employee} from '../../../../core/services/employees/employee.types';

@Component({
  selector: 'app-edit-schedule-component',
  providers: [provideNativeDateAdapter()],
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTimepickerModule
  ],
  templateUrl: './edit-schedule-component.component.html',
  styleUrl: './edit-schedule-component.component.scss'
})
export class EditScheduleComponentComponent implements OnInit {
  @Input() selectedCell: {
    employee: any;
    day: number;
    date: Date;
    workHours: string;
  } | null = null;

  editScheduleForm!: FormGroup;

  timeFrom = signal<string>('')
  timeTo = signal<string>('')


  constructor(
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    ) {
  }

  ngOnInit() {
    this.editScheduleForm = this.formBuilder.group({
      hours: this.formattedTime,
    })

    console.log(this.selectedCell)
  }

  formattedTime = computed(() => {
    const from = this.timeFrom();
    const to = this.timeTo();

    if(from && to){
      return `${from}-${to}`;
    } else {
      return '';
    }
  })

  onEditPanelSave(){
    if(this.editScheduleForm.valid) {
      // this.scheduleService.updateWorkHours()
    }
  }

}
