import {Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, SimpleChanges} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTimepickerModule, MatTimepickerOption} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {DateAdapter, provideNativeDateAdapter} from '@angular/material/core';
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
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);

  @Input() selectedCell: {
    employee: any;
    workHours: any;
    date: string;
  } | null = null;

  @Output() cancelSelection = new EventEmitter<void>();

  editScheduleForm!: FormGroup;

  timeFrom = signal<Date | null>(null)
  timeTo = signal<Date | null>(null)


  constructor(
    private formBuilder: FormBuilder,
    private scheduleService: ScheduleService,
    ) {
  }

  ngOnInit() {
    this._adapter.setLocale('pl-PL');

    const defaultStartTime = new Date();
    defaultStartTime.setHours(6, 0, 0, 0);
    this.timeFrom.set(defaultStartTime);

    this.editScheduleForm = this.formBuilder.group({
      employee: [''],
      hours: ['', Validators.required],
      date: ['']
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    //tego uzywwam do sprawdzania co sie dzieje kiedy input sie zminia

    if(this.selectedCell){
      // RESET timepickerów
      this.timeFrom.set(null);
      this.timeTo.set(null);

      // RESET formularza
      this.editScheduleForm.patchValue({
        employee: this.selectedCell.employee.id,
        hours: '',
        date: this.selectedCell.workHours ? this.selectedCell.workHours.date : this.selectedCell.date,
      });
    }
  }

  formattedTime = computed(() => {
    const from = this.timeFrom();
    const to = this.timeTo();

    if (from && to) {
      // Wyciągnij tylko HH:MM z Date object
      const fromTime = new Date(from).toTimeString().substring(0, 5); // "08:00"
      const toTime = new Date(to).toTimeString().substring(0, 5);     // "16:00"
      return `${fromTime}-${toTime}`;
    }
    return '';
  });

  onEditPanelSave(){

    //Zanim wysylam to umieszczam godziny w polu hours
    this.editScheduleForm.patchValue({
      hours: this.formattedTime()
    })

    if(this.editScheduleForm.valid) {
      // this.scheduleService.updateWorkHours().subscribe();
      //jezeli formularz jest wypelniony to updateujemy alb wstaiwamy nowy
      //jezeli updateujemy to musi byc watunek spelniony

      console.log("editScheduleForm", this.editScheduleForm.value);
      if(this.selectedCell?.workHours){
        this.scheduleService.updateWorkHours(this.selectedCell.workHours.id, this.editScheduleForm.value).subscribe(workHours => {})
      } else {
        // this.scheduleService.addWorkHours(this.selectedCell).subscribe();
      }
    }
  }

  onEditPanelCancel(){
    this.timeFrom.set(null);
    this.timeTo.set(null);
    this.editScheduleForm.reset();
    this.cancelSelection.emit();
  }

  onTimeFromChange(value: Date) {
    this.timeFrom.set(value);

    if (this.timeTo() && this.timeTo()! <= value) {
      this.timeTo.set(null);
    }
  }

  onTimeToChange(value: Date) {
    const fromTime = this.timeFrom();
    if (fromTime && value > fromTime) {
      this.timeTo.set(value);
    } else {
      alert('Godzina "Do" musi być późniejsza niż "Od"');
    }
  }

}
