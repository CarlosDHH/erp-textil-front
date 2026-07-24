import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'

export interface InventoryMovement {
  id: string
  userId: string
  batchId?: string
  batchNumber?: string | null
  supplyId?: string | null
  supplyName?: string | null
  /** Unidad de medida del insumo (Metros, Piezas, Conos…), resuelta por el backend. */
  unitMeasure?: string | null
  /** entry | exit | adjustment | loss */
  type: string
  quantity?: number
  reason?: string | null
  createdAt: string
}

export interface InventoryMovementListResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    data: InventoryMovement[]
    meta: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/inventoryMovement`

  getByUser(userId: string, page = 1, limit = 10): Observable<InventoryMovementListResponse> {
    const params = new HttpParams().set('userId', userId).set('page', page).set('limit', limit)
    return this.http.get<InventoryMovementListResponse>(this.apiUrl, { params })
  }
}
