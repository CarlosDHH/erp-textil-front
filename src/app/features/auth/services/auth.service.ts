import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable, catchError, map, of } from 'rxjs'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser'
import { environment } from '../../../../environments/environment'

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    user: {
      id: string
      name: string
      lastName: string
      email: string
      role: string
    }
    accessToken: string
    refreshToken: string
  }
}

export interface RefreshResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
  }
}

export interface ApiMessageResponse {
  statusCode: number
  success: boolean
  message: string
  data?: unknown
  errors?: string
}

export interface BiometricLoginOptionsResponse {
  statusCode: number
  success: boolean
  message: string
  data: PublicKeyCredentialRequestOptionsJSON
}

export interface BiometricRegisterOptionsResponse {
  statusCode: number
  success: boolean
  message: string
  data: PublicKeyCredentialCreationOptionsJSON
}

export interface BiometricStatus {
  registered: boolean
  friendlyName: string | null
  deviceType: string | null
  createdAt: string | null
  lastUsedAt: string | null
}

export interface BiometricStatusResponse {
  statusCode: number
  success: boolean
  message: string
  data: BiometricStatus
}

export type SessionStatus = 'online' | 'offline'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload)
  }

  refresh(refreshToken: string): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.apiUrl}/refresh`, { refreshToken })
  }

  forgotPassword(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/forgot-password`, { email })
  }

  resetPassword(token: string, password: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/reset-password`, { token, password })
  }

  /**
   * Confirma la contraseña actual del usuario logueado reutilizando `/auth/login`
   * (decisión explícita: no existe un endpoint dedicado de verificación de contraseña).
   * Propaga el mensaje real del backend (p. ej. bloqueo de cuenta por intentos fallidos)
   * en vez de colapsarlo a un simple `false`, para no mostrar "contraseña incorrecta"
   * cuando el verdadero motivo es otro (cuenta bloqueada, error de red, etc.).
   */
  verifyPassword(email: string, password: string): Observable<{ valid: boolean; message?: string }> {
    return this.login({ email, password }).pipe(
      map((res) => ({ valid: !!res.success, message: res.success ? undefined : res.message })),
      catchError((error: HttpErrorResponse) =>
        of({
          valid: false,
          message: error?.error?.message ?? 'No se pudo verificar la contraseña.',
        })
      )
    )
  }

  /** Indica si el usuario en sesión ya tiene una huella registrada. */
  getBiometricStatus(): Observable<BiometricStatusResponse> {
    return this.http.get<BiometricStatusResponse>(`${this.apiUrl}/biometric/status`)
  }

  /** Elimina la huella del usuario en sesión para poder registrar otra. */
  deleteBiometric(): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiUrl}/biometric`)
  }

  getBiometricRegisterOptions(): Observable<BiometricRegisterOptionsResponse> {
    return this.http.get<BiometricRegisterOptionsResponse>(
      `${this.apiUrl}/biometric/register/options`
    )
  }

  verifyBiometricRegister(credential: RegistrationResponseJSON): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/biometric/register/verify`, {
      credential,
    })
  }

  getBiometricLoginOptions(email: string): Observable<BiometricLoginOptionsResponse> {
    return this.http.post<BiometricLoginOptionsResponse>(
      `${this.apiUrl}/biometric/login/options`,
      { email }
    )
  }

  verifyBiometricLogin(
    email: string,
    credential: AuthenticationResponseJSON
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/biometric/login/verify`, {
      email,
      credential,
    })
  }

  /**
   * Notifica al backend el estado de sesión del usuario (online/offline).
   * El token se pasa explícitamente (en vez de depender del interceptor) para que
   * la llamada siga funcionando incluso cuando el reducer ya limpió el estado de auth
   * (p. ej. justo antes/durante el logout).
   * NOTE: el endpoint `/auth/status` es una convención asumida — el backend aún no lo
   * documenta en API.md. Los llamadores deben tratar el fallo como no crítico (catchError).
   */
  updateSessionStatus(status: SessionStatus, accessToken?: string | null): Observable<ApiMessageResponse> {
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/status`, { status }, { headers })
  }

  /**
   * Variante "best effort" para notificar offline al cerrar/recargar la pestaña.
   * Usa sendBeacon porque una petición HTTP normal puede no completarse durante
   * `beforeunload`. sendBeacon no admite headers, así que el token viaja en el body.
   */
  notifyOfflineBeacon(accessToken: string): void {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return
    try {
      const blob = new Blob([JSON.stringify({ status: 'offline', accessToken })], {
        type: 'application/json',
      })
      navigator.sendBeacon(`${this.apiUrl}/status`, blob)
    } catch {
      // best-effort únicamente, se ignora cualquier fallo
    }
  }
}
