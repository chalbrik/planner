import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  error: string | null = null;

  autoLogin = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

    // Sprawdź, czy jesteśmy w trybie deweloperskim
    if (typeof window !== 'undefined' && !environment.production && this.autoLogin) {
      // Ustaw dane dla trybu deweloperskiego
      this.loginForm.setValue({
        username: 'chalbrik',  // Zmień na własne dane testowe
        password: 'alpachino'  // Zmień na własne dane testowe
      });

      // Automatyczne logowanie po krótkim opóźnieniu
      setTimeout(() => {
        this.onSubmit();
      }, 500);
    }

  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/schedule']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.detail) {
          this.error = err.error.detail;
        } else {
          this.error = 'Wystąpił błąd podczas logowania. Spróbuj ponownie.';
        }
        console.error('Błąd logowania:', err);
      }
    });
  }
}
