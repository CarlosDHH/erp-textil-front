import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

export interface RolePermission {
  id: string
  module: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  permissions?: RolePermission[]
}

export interface RoleListResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    data: Role[]
    meta: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

export interface RoleResponse {
  statusCode: number
  success: boolean
  message: string
  data: Role
}

export interface CreateRolePayload {
  name: string
  description?: string
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  isActive?: boolean
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/roles`

  getAll(page = 1, limit = 20, search?: string): Observable<RoleListResponse> {
    let params = new HttpParams().set('page', page).set('limit', limit)
    if (search) params = params.set('search', search)
    return this.http.get<RoleListResponse>(this.apiUrl, { params })
  }

  getById(id: string): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/${id}`)
  }

  create(payload: CreateRolePayload): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, payload)
  }

  update(id: string, payload: UpdateRolePayload): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, payload)
  }

  remove(id: string): Observable<RoleResponse> {
    return this.http.delete<RoleResponse>(`${this.apiUrl}/${id}`)
  }
}
