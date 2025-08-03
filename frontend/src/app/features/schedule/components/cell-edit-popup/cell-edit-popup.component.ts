import {Component, effect, input, output, signal, ViewEncapsulation} from '@angular/core';
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from '@angular/material/timepicker';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MAT_DATE_LOCALE, provideNativeDateAdapter} from '@angular/material/core';
import {IconComponent} from '../../../../shared/components/icon';
import {MatDivider, MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-cell-edit-popup',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }
  ],
  imports: [
    MatIcon,
    MatFormField,
    MatLabel,
    MatTimepickerToggle,
    MatTimepicker,
    MatTimepickerInput,
    MatButton,
    MatInput,
    MatIconButton,
    MatSuffix,
    IconComponent,
    MatDivider,
    MatDividerModule
  ],
  templateUrl: './cell-edit-popup.component.html',
  styleUrl: './cell-edit-popup.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CellEditPopupComponent {
  // Input z selectedCell
  readonly selectedCell = input<{
    employee: any;
    workHours: any;
    date: string;
  } | undefined>();

  // Sygnały dla czasów
  timeFrom = signal<Date | null>(null);
  timeTo = signal<Date | null>(null);

  // Output events
  readonly save = output<{ hours: string; employee: string; date: string; id?: string }>();
  readonly cancel = output<void>();
  readonly delete = output<{ id: string }>();

  constructor() {
    // Effect - ustaw czasy z selectedCell gdy się zmieni
    effect(() => {
      const cell = this.selectedCell();
      if (cell?.workHours?.hours) {
        // Parsuj "8:00-16:00" na Date objects
        this.parseAndSetTimes(cell.workHours.hours);
      } else {
        // Reset dla pustej komórki - ustaw domyślne czasy
        const defaultFrom = new Date();
        defaultFrom.setHours(8, 0, 0, 0);
        const defaultTo = new Date();
        defaultTo.setHours(16, 0, 0, 0);

        this.timeFrom.set(defaultFrom);
        this.timeTo.set(defaultTo);
      }
    });
  }

  private parseAndSetTimes(hoursString: string) {
    // Parsuj format "8:00-16:00"
    const match = hoursString.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);

    if (match) {
      const [, startHour, startMin, endHour, endMin] = match;

      // Stwórz Date objects
      const fromDate = new Date();
      fromDate.setHours(parseInt(startHour), parseInt(startMin), 0, 0);

      const toDate = new Date();
      toDate.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

      this.timeFrom.set(fromDate);
      this.timeTo.set(toDate);
    }
  }

  private formatTimes(): string {
    const from = this.timeFrom();
    const to = this.timeTo();

    if (from && to) {
      const fromTime = from.toTimeString().substring(0, 5); // "08:00"
      const toTime = to.toTimeString().substring(0, 5);     // "16:00"
      return `${fromTime}-${toTime}`;
    }
    return '';
  }

  onTimeFromChange(value: Date) {
    this.timeFrom.set(value);
  }

  onTimeToChange(value: Date) {
    this.timeTo.set(value);
  }

  onSave() {
    const cell = this.selectedCell();
    if (!cell) return;

    const hoursString = this.formatTimes();
    if (!hoursString) return;

    this.save.emit({
      hours: hoursString,
      employee: cell.employee.id,
      date: cell.date,
      id: cell.workHours?.id // dla update lub undefined dla create
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  onDelete() {
    const cell = this.selectedCell();
    if (cell?.workHours?.id) {
      this.delete.emit({ id: cell.workHours.id });
    }
  }
}
