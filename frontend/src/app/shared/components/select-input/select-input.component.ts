import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true
    }
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelect,
    MatOption
  ],
  templateUrl: './select-input.component.html',
  styleUrls: ['./select-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectInputComponent implements ControlValueAccessor {
  // Inputs
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly errorMessage = input<string>('Pole obowiązkowe');
  readonly disabled = input<boolean>(false);
  readonly showError = input<boolean>(false);
  readonly options = input<SelectOption[]>([]);

  // Stan komponentu jako sygnał
  private readonly _value = signal<string>('');
  readonly value = computed(() => this._value());

  // Output dla ngModel compatibility
  readonly selectionChange = output<string>();

  // Callbacks dla ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Implementacja ControlValueAccessor
  writeValue(value: string | null): void {
    this._value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Możesz dodać dodatkową logikę dla disabled state jeśli potrzebna
  }

  // Event handlers
  handleSelectionChange(value: string): void {
    this._value.set(value);
    this.onChange(value);
    this.selectionChange.emit(value); // Dla ngModel compatibility
  }

  handleBlur(): void {
    this.onTouched();
  }
}
