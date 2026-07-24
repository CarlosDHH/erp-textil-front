import { createAction, props } from '@ngrx/store'
import { AuthUser } from './auth.state'

export const rehydrateAuth = createAction(
  '[Auth] Rehydrate',
  props<{ user: AuthUser; accessToken: string; refreshToken: string }>()
)

export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
)

export const loginBiometric = createAction(
  '[Auth] Login Biometric',
  props<{ email: string }>()
)

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: AuthUser; accessToken: string; refreshToken: string }>()
)

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
)

export const logout = createAction('[Auth] Logout')

export const refreshToken = createAction(
  '[Auth] Refresh Token',
  props<{ refreshToken: string }>()
)

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ accessToken: string; refreshToken: string }>()
)

export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>()
)

export const clearAuth = createAction('[Auth] Clear Auth')
