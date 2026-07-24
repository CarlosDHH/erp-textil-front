import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

export interface User {
  id: string
  name: string
  lastName: string
  email: string
  phone?: string
  role: string
  active: boolean
  createdAt: string
}

export interface UserListResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    data: User[]
    meta: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

export interface UserResponse {
  statusCode: number
  success: boolean
  message: string
  data: User
}

export interface CheckPhoneResponse {
  statusCode: number
  success: boolean
  message: string
  data: { exists: boolean }
}

export interface CreateUserPayload {
  name: string
  lastName: string
  email: string
  phone?: string
  password: string
  roleId: string
}

export interface UpdateUserPayload {
  name?: string
  lastName?: string
  phone?: string
  roleId?: string
  active?: boolean
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/users`

  getAll(page = 1, limit = 20, search?: string): Observable<UserListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit)
    if (search) params = params.set('search', search)
    return this.http.get<UserListResponse>(this.apiUrl, { params })
  }

  getById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`)
  }

  /** Verifica si un teléfono ya está registrado por otro usuario. */
  checkPhone(phone: string, excludeId?: string | null): Observable<CheckPhoneResponse> {
    let params = new HttpParams().set('phone', phone)
    if (excludeId) params = params.set('excludeId', excludeId)
    return this.http.get<CheckPhoneResponse>(`${this.apiUrl}/check-phone`, { params })
  }

  create(payload: CreateUserPayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, payload)
  }

  update(id: string, payload: UpdateUserPayload): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, payload)
  }

  remove(id: string): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.apiUrl}/${id}`)
  }
}
