import {Component, inject, OnInit, signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import {IconComponent} from '../../../shared/components/icon';
import {MatError, MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    NgClass,
    IconComponent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatFormField,
    MatButton,
  ]
})
export class LoginComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoading = false;

  // Rozdzielone zmienne dla każdego formularza
  loginError: string | null = null;
  registerError: string | null = null;
  registerSuccess: string | null = null;

  // Signal do kontroli sliding overlay
  readonly isSlid = signal<boolean>(false);

  constructor() {}

  ngOnInit(): void {
    // Formularz logowania
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Formularz rejestracji - uproszczony
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  // Metoda do przełączania paneli
  togglePanel(): void {
    this.isSlid.set(!this.isSlid());
    this.clearMessages();
  }

  // Czyszczenie komunikatów
  clearMessages(): void {
    this.loginError = null;
    this.registerError = null;
    this.registerSuccess = null;
  }

  // Logowanie
  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = null;

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/app/schedule']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.detail) {
          this.loginError = err.error.detail;
        } else {
          this.loginError = 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
        }
        console.error('Błąd logowania:', err);
      }
    });
  }

  // Rejestracja
  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    // Sprawdzenie czy hasła się zgadzają
    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.registerError = 'Hasła nie są identyczne';
      return;
    }

    this.isLoading = true;
    this.registerError = null;
    this.registerSuccess = null;

    const registerData = {
      username: this.registerForm.value.username,
      password: this.registerForm.value.password,
      email: '', // Puste pole email
      first_name: '',
      last_name: ''
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        this.registerSuccess = 'Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.';
        setTimeout(() => {
          this.togglePanel(); // Przełącz na panel logowania
          this.registerForm.reset();
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error) {
          if (typeof err.error === 'string') {
            this.registerError = err.error;
          } else if (err.error.username) {
            this.registerError = `Nazwa użytkownika: ${err.error.username.join(', ')}`;
          } else if (err.error.password) {
            this.registerError = `Hasło: ${err.error.password.join(', ')}`;
          } else {
            this.registerError = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
          }
        } else {
          this.registerError = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
        }
        console.error('Błąd rejestracji:', err);
      }
    });
  }

  shouldShowLoginError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

  shouldShowRegisterError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control?.invalid && control?.touched);
  }

}
