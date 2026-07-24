import { inject, Injectable } from '@angular/core'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { Router } from '@angular/router'
import { catchError, map, switchMap, tap } from 'rxjs/operators'
import { from, of } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { startAuthentication } from '@simplewebauthn/browser'
import * as AuthActions from './auth.actions'
import { AuthService } from '../services/auth.service'
import { StorageService } from '../../../core/services/storage.service'
import { AuthUser } from './auth.state'

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions)
  private authService = inject(AuthService)
  private storageService = inject(StorageService)
  private router = inject(Router)

  rehydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType('@ngrx/effects/init'),
      map(() => {
        const accessToken = this.storageService.getAccessToken()
        const refreshToken = this.storageService.getRefreshToken()
        const user = this.storageService.getUser<AuthUser>()

        if (accessToken && refreshToken && user) {
          return AuthActions.rehydrateAuth({ user, accessToken, refreshToken })
        }
        // Si no hay tokens → despacha logout → logout$ navega a /auth/login
        // Esto pasa aunque estés en /home que es pública
        return AuthActions.clearAuth() // ← solo limpia el estado, no navega
        // return AuthActions.logout()
      })
    )
  )

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login({ email, password }).pipe(
          map((response) => {
            if (!response.success) {
              return AuthActions.loginFailure({ error: response.message })
            }
            return AuthActions.loginSuccess({
              user: response.data.user,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            })
          }),
          catchError((error: HttpErrorResponse) => {
            const message =
              error?.error?.message ?? error?.message ?? 'Error al iniciar sesión'
            return of(AuthActions.loginFailure({ error: message }))
          })
        )
      )
    )
  )

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ user, accessToken, refreshToken }) => {
        this.storageService.setTokens(accessToken, refreshToken)
        this.storageService.setUser(user)
        this.authService
          .updateSessionStatus('online', accessToken)
          .pipe(catchError(() => of(null)))
          .subscribe()
        this.router.navigate(['/admin/dashboard'])
      })
    ),
    { dispatch: false }
  )

  loginBiometric$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginBiometric),
      switchMap(({ email }) =>
        this.authService.getBiometricLoginOptions(email).pipe(
          switchMap((optionsResponse) => {
            if (!optionsResponse.success) {
              return of(AuthActions.loginFailure({ error: optionsResponse.message }))
            }
            return from(startAuthentication({ optionsJSON: optionsResponse.data })).pipe(
              switchMap((credential) =>
                this.authService.verifyBiometricLogin(email, credential).pipe(
                  map((response) => {
                    if (!response.success) {
                      return AuthActions.loginFailure({ error: response.message })
                    }
                    return AuthActions.loginSuccess({
                      user: response.data.user,
                      accessToken: response.data.accessToken,
                      refreshToken: response.data.refreshToken,
                    })
                  }),
                  catchError((error: HttpErrorResponse) => {
                    const message =
                      error?.error?.message ?? 'No se pudo verificar la huella biométrica'
                    return of(AuthActions.loginFailure({ error: message }))
                  })
                )
              ),
              catchError((error: { name?: string }) => {
                const message =
                  error?.name === 'NotAllowedError'
                    ? 'Autenticación biométrica cancelada.'
                    : 'No se pudo completar la autenticación biométrica en este dispositivo.'
                return of(AuthActions.loginFailure({ error: message }))
              })
            )
          }),
          catchError((error: HttpErrorResponse) => {
            const message =
              error?.error?.message ?? 'No se pudo iniciar la autenticación biométrica'
            return of(AuthActions.loginFailure({ error: message }))
          })
        )
      )
    )
  )

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        const accessToken = this.storageService.getAccessToken()
        this.authService
          .updateSessionStatus('offline', accessToken)
          .pipe(catchError(() => of(null)))
          .subscribe()
        this.storageService.clear()
        this.router.navigate(['/auth/login'])
      })
    ),
    { dispatch: false }
  )

  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(({ refreshToken }) =>
        this.authService.refresh(refreshToken).pipe(
          map((response) => {
            if (!response.success) {
              return AuthActions.refreshTokenFailure({ error: response.message })
            }
            return AuthActions.refreshTokenSuccess({
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            })
          }),
          catchError(() => of(AuthActions.refreshTokenFailure({ error: 'Error al renovar sesión' })))
        )
      )
    )
  )

  refreshTokenSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshTokenSuccess),
      tap(({ accessToken, refreshToken }) => {
        this.storageService.setTokens(accessToken, refreshToken)
      })
    ),
    { dispatch: false }
  )
}
