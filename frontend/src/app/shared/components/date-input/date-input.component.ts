import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {MatNativeDateModule, provideNativeDateAdapter} from '@angular/material/core';

@Component({
  selector: 'app-date-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true
    },
    provideNativeDateAdapter()
  ],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatNativeDateModule
  ],
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateInputComponent implements ControlValueAccessor {
  // Inputs używając funkcji input()
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly errorMessage = input<string>('Pole obowiązkowe');
  readonly disabled = input<boolean>(false);
  readonly showError = input<boolean>(false);

  // Stan komponentu jako sygnał
  private readonly _value = signal<Date | null>(null);
  readonly value = computed(() => this._value());

  // Callbacks dla ControlValueAccessor
  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  // Implementacja ControlValueAccessor
  writeValue(value: Date | null): void {
    this._value.set(value);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Możesz dodać dodatkową logikę dla disabled state jeśli potrzebna
  }

  // Event handlers
  handleDateChange(event: any): void {
    const selectedDate = event.value as Date | null;
    this._value.set(selectedDate);
    this.onChange(selectedDate);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
