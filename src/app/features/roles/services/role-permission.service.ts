import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

export interface RolePermissionRecord {
  id: string
  roleId: string
  moduleId: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export type RolePermissionFlags = Pick<
  RolePermissionRecord,
  'canView' | 'canCreate' | 'canEdit' | 'canDelete'
>

export interface RolePermissionListResponse {
  statusCode: number
  success: boolean
  message: string
  data: RolePermissionRecord[]
}

export interface RolePermissionResponse {
  statusCode: number
  success: boolean
  message: string
  data: RolePermissionRecord
}

/**
 * El backend expone esta entidad bajo `/roleModule` (nombre heredado), pero es
 * la tabla puente rol↔módulo (`RolePermission`): una fila por combinación
 * (roleId, moduleId). `getAll()` no filtra por rol, así que el filtrado por
 * roleId se hace del lado del cliente.
 */
@Injectable({ providedIn: 'root' })
export class RolePermissionService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/roleModule`

  getAll(): Observable<RolePermissionListResponse> {
    return this.http.get<RolePermissionListResponse>(this.apiUrl)
  }

  create(
    payload: { roleId: string; moduleId: string } & RolePermissionFlags
  ): Observable<RolePermissionResponse> {
    return this.http.post<RolePermissionResponse>(this.apiUrl, payload)
  }

  update(id: string, payload: Partial<RolePermissionFlags>): Observable<RolePermissionResponse> {
    return this.http.patch<RolePermissionResponse>(`${this.apiUrl}/${id}`, payload)
  }

  remove(id: string): Observable<{ statusCode: number; success: boolean; message: string }> {
    return this.http.delete<{ statusCode: number; success: boolean; message: string }>(
      `${this.apiUrl}/${id}`
    )
  }
}
