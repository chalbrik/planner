import {Component, inject, OnInit} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {LocationService} from '../../../../core/services/locations/location.service';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {InputComponent} from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-location-form',
  imports: [
    MatButton,
    ReactiveFormsModule,
    InputComponent
  ],
  templateUrl: './location-form.component.html',
  styleUrl: './location-form.component.scss'
})
export class LocationFormComponent implements OnInit {

  private readonly formBuilder = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locationService = inject(LocationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  addLocationForm!: FormGroup;

  ngOnInit() {

    this.addLocationForm = this.formBuilder.group({

      name: [''],
      address: [''],

    })

  }

  onAddLocation() {
    if(this.addLocationForm.valid) {
      this.locationService.addLocation(this.addLocationForm.getRawValue()).subscribe({
        next: (newLocation) => {
          this.snackBar.open('Dodano nowy obiekt!', 'OK', { duration: 3000 });
          this.bottomSheet.dismiss(newLocation);
        },
        error: (error) => {
          console.error('Błąd:', error);
          this.snackBar.open('Błąd!', 'OK', { duration: 3000 });
        }
      })
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.addLocationForm.get(controlName);

    if (control?.errors) {
      return 'Pole obowiązkowe';
    }

    return '';
  }

  shouldShowError(controlName: string): boolean {
    const control = this.addLocationForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

}
