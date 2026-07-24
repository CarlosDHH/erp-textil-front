import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { Subject, finalize, takeUntil } from 'rxjs'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { InputTextModule } from 'primeng/inputtext'
import { PasswordModule } from 'primeng/password'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'
import { DialogModule } from 'primeng/dialog'

import { login, loginBiometric } from '../../store/auth.actions'
import { selectAuthLoading, selectAuthError } from '../../store/auth.selectors'
import { AuthService } from '../../services/auth.service'
import { strictEmailValidator } from '../../../../core/validators/email.validator'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    DialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder)
  private store = inject(Store)
  private authService = inject(AuthService)

  loading$ = this.store.select(selectAuthLoading)
  error$ = this.store.select(selectAuthError)

  webAuthnSupported = signal(false)
  biometricError = signal<string | null>(null)

  loginForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  })

  showForgotPasswordModal = signal(false)
  forgotPasswordLoading = signal(false)
  forgotPasswordSuccess = signal(false)
  forgotPasswordError = signal<string | null>(null)
  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
  })

  private destroy$ = new Subject<void>()

  get email() { return this.loginForm.get('email') }
  get password() { return this.loginForm.get('password') }
  get forgotEmail() { return this.forgotPasswordForm.get('email') }

  ngOnInit(): void {
    this.webAuthnSupported.set(browserSupportsWebAuthn())
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return
    const { email, password } = this.loginForm.value
    this.store.dispatch(login({ email: email!, password: password! }))
  }

  onBiometricLogin(): void {
    this.biometricError.set(null)
    this.email?.markAsTouched()
    if (this.email?.invalid || !this.email?.value) {
      this.biometricError.set('Introduce tu correo electrónico para continuar con la huella/rostro.')
      return
    }
    this.store.dispatch(loginBiometric({ email: this.email.value }))
  }

  openForgotPasswordModal(): void {
    this.forgotPasswordForm.reset()
    this.forgotPasswordSuccess.set(false)
    this.forgotPasswordError.set(null)
    this.showForgotPasswordModal.set(true)
  }

  onForgotPasswordSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched()
      return
    }
    const email = this.forgotPasswordForm.value.email!
    this.forgotPasswordLoading.set(true)
    this.forgotPasswordError.set(null)
    this.authService
      .forgotPassword(email)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.forgotPasswordLoading.set(false))
      )
      .subscribe({
        next: () => this.forgotPasswordSuccess.set(true),
        error: (err) => {
          this.forgotPasswordError.set(
            err?.error?.message ?? 'No se pudo enviar el correo de recuperación.'
          )
        },
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}

