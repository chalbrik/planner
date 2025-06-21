import {Component, computed, Input, OnInit, signal, SimpleChanges} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTimepickerModule, MatTimepickerOption} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ScheduleService} from '../../../../core/services/schedule/schedule.service';
import {Employee} from '../../../../core/services/employees/employee.types';

interface onChanges {
}

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
export class EditScheduleComponentComponent implements OnInit, onChanges {
  @Input() selectedCell: {
    employee: any;
    workHours: any;
    date: string;
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
      employee: [''],
      hours: [this.formattedTime, Validators.required],
      date: ['']
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    //tego uzywwam do sprawdzania co sie dzieje kiedy input sie zminia

    //faktycznie trzeba bedzie date przesylac poniewaz nie zawsze workHours istnieje
    if(this.selectedCell){
      this.editScheduleForm.patchValue({
        employee: this.selectedCell.employee,
        date: this.selectedCell.workHours ? this.selectedCell.workHours.date : this.selectedCell.date,
      });

      console.log("editScheduleForm", this.editScheduleForm.value);
    }
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
      // this.scheduleService.updateWorkHours().subscribe();
      //jezeli formularz jest wypelniony to updateujemy alb wstaiwamy nowy
      //jezeli updateujemy to musi byc watunek spelniony

      if(this.selectedCell?.workHours){
        this.scheduleService.updateWorkHours(this.selectedCell.workHours.id, this.editScheduleForm.value).subscribe(workHours => {})
      } else {
        // this.scheduleService.addWorkHours(this.selectedCell).subscribe();
      }
    }
  }

}
