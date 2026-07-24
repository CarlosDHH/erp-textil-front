import { Component, OnInit, inject, signal } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms'
import { PasswordModule } from 'primeng/password'
import { ButtonModule } from 'primeng/button'

import { AuthService } from '../../services/auth.service'

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value
    const confirmPassword = group.get('confirmPassword')?.value
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null
  }
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PasswordModule, ButtonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder)
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private authService = inject(AuthService)

  token = signal<string | null>(null)
  loading = signal(false)
  success = signal(false)
  errorMessage = signal<string | null>(null)

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator() }
  )

  get password() {
    return this.form.get('password')
  }
  get confirmPassword() {
    return this.form.get('confirmPassword')
  }

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'))
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const token = this.token()
    if (!token) return

    this.loading.set(true)
    this.errorMessage.set(null)
    this.authService.resetPassword(token, this.password!.value!).subscribe({
      next: (res) => {
        this.loading.set(false)
        if (res.success) {
          this.success.set(true)
        } else {
          this.errorMessage.set(res.message)
        }
      },
      error: (err) => {
        this.loading.set(false)
        this.errorMessage.set(
          err?.error?.message ?? 'El enlace de recuperación es inválido o ha expirado.'
        )
      },
    })
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'])
  }
}
