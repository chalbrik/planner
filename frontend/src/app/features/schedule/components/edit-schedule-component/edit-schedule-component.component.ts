import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  SimpleChanges,
  ViewEncapsulation,
  input,
  output
} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatTimepickerModule, MatTimepickerOption} from '@angular/material/timepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {DateAdapter, provideNativeDateAdapter} from '@angular/material/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ScheduleService} from '../../../../core/services/schedule/schedule.service';
import {Employee} from '../../../../core/services/employees/employee.types';
import {IconComponent} from '../../../../shared/components/icon';


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
    MatTimepickerModule,
    IconComponent
  ],
  templateUrl: './edit-schedule-component.component.html',
  styleUrl: './edit-schedule-component.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditScheduleComponentComponent implements OnInit, onChanges {
  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);

  readonly selectedCell = input<{
    employee: any;
    workHours: any;
    date: string;
  } | undefined>();

  readonly cancelSelection = output<void>();

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

    const selectedCell = this.selectedCell();
    if(selectedCell){
      // RESET timepickerów
      this.timeFrom.set(null);
      this.timeTo.set(null);

      // RESET formularza
      this.editScheduleForm.patchValue({
        employee: selectedCell.employee.id,
        hours: '',
        date: selectedCell.workHours ? selectedCell.workHours.date : selectedCell.date,
      });
    }

    // console.log("selectedCell: ", this.selectedCell);
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


      const selectedCell = this.selectedCell();
      if(selectedCell?.workHours){
        this.scheduleService.updateWorkHours(selectedCell.workHours.id, this.editScheduleForm.value).subscribe(workHours => {})
      } else {
        this.scheduleService.addWorkHours(this.editScheduleForm.value).subscribe();
      }
    }
  }

  onEditPanelCancel(){
    this.timeFrom.set(null);
    this.timeTo.set(null);
    this.editScheduleForm.reset();
    // TODO: The 'emit' function requires a mandatory void argument
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
