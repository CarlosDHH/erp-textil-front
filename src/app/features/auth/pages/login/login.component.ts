import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms'
import { Store } from '@ngrx/store'
import { Subject } from 'rxjs'
import { InputTextModule } from 'primeng/inputtext'
import { PasswordModule } from 'primeng/password'
import { ButtonModule } from 'primeng/button'
import { MessageModule } from 'primeng/message'

import { login } from '../../store/auth.actions'
import { selectAuthLoading, selectAuthError } from '../../store/auth.selectors'

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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder)
  private store = inject(Store)

  loading$ = this.store.select(selectAuthLoading)
  error$ = this.store.select(selectAuthError)

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  })

  private destroy$ = new Subject<void>()

  get email() { return this.loginForm.get('email') }
  get password() { return this.loginForm.get('password') }

  onSubmit(): void {
    if (this.loginForm.invalid) return
    const { email, password } = this.loginForm.value
    this.store.dispatch(login({ email: email!, password: password! }))
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
