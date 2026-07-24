import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

export interface AppModule {
  id: string
  slug: string
  name: string
  description?: string
  icon?: string
  path?: string
  parentId?: string | null
  sortOrder: number
  isActive: boolean
}

export interface ModuleListResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    data: AppModule[]
    meta: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/modules`

  getAll(page = 1, limit = 100): Observable<ModuleListResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit)
    return this.http.get<ModuleListResponse>(this.apiUrl, { params })
  }
}
