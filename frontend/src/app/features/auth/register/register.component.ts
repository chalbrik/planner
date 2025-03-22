import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = 'Rejestracja zakończona pomyślnie! Możesz się teraz zalogować.';
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error) {
          // Przetwarzanie błędów z backendu
          if (typeof err.error === 'string') {
            this.error = err.error;
          } else if (err.error.username) {
            this.error = `Nazwa użytkownika: ${err.error.username.join(', ')}`;
          } else if (err.error.email) {
            this.error = `Email: ${err.error.email.join(', ')}`;
          } else if (err.error.password) {
            this.error = `Hasło: ${err.error.password.join(', ')}`;
          } else {
            this.error = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
          }
        } else {
          this.error = 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.';
        }
        console.error('Błąd rejestracji:', err);
      }
    });
  }
}
