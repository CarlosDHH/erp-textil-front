import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../environments/environment'

/** Tipos de movimiento del backend (se guardan en inglés). */
export type MovementType = 'entry' | 'exit' | 'adjustment' | 'loss'

/** Movimientos que descuentan inventario: salidas y mermas. */
export const DISCOUNT_MOVEMENT_TYPES: MovementType[] = ['exit', 'loss']

export interface InventoryMovement {
  id: string
  userId: string
  batchId?: string
  batchNumber?: string | null
  supplyId?: string | null
  supplyName?: string | null
  unitMeasure?: string | null
  type: MovementType | string
  quantity?: number
  reason?: string | null
  createdAt: string
}

export interface PaginatedMovements {
  statusCode: number
  success: boolean
  message: string
  data: {
    data: InventoryMovement[]
    meta: { total: number; page: number; limit: number; pages: number }
  }
}

export interface MovementQuery {
  userId?: string
  /** Uno o varios tipos; se envían separados por coma. */
  types?: MovementType[]
  /** Límite inferior inclusivo. */
  from?: Date
  /** Límite superior inclusivo. */
  to?: Date
  page?: number
  limit?: number
}

/**
 * Acceso a `/api/inventoryMovement`. El backend acepta los filtros `userId`,
 * `type` (lista separada por comas), `from` y `to`, de modo que el resumen del
 * dashboard se resuelve en una sola petición en lugar de traerlo todo y filtrar
 * en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class InventoryMovementService {
  private http = inject(HttpClient)
  private apiUrl = `${environment.apiUrl}/inventoryMovement`

  list(query: MovementQuery = {}): Observable<PaginatedMovements> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('limit', query.limit ?? 20)

    if (query.userId) params = params.set('userId', query.userId)
    if (query.types?.length) params = params.set('type', query.types.join(','))
    if (query.from) params = params.set('from', query.from.toISOString())
    if (query.to) params = params.set('to', query.to.toISOString())

    return this.http.get<PaginatedMovements>(this.apiUrl, { params })
  }
}
