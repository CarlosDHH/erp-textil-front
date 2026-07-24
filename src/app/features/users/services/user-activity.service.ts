import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import {
  InventoryMovement,
  InventoryMovementService,
  PaginatedMovements,
} from '../../../core/services/inventory-movement.service'

// Se reexportan para no romper los imports existentes del perfil de usuario.
export type { InventoryMovement }
export type InventoryMovementListResponse = PaginatedMovements

/**
 * Actividad reciente de un usuario: son sus movimientos de inventario.
 * Envuelve al servicio compartido para que el perfil no dependa de la forma
 * concreta de los filtros del endpoint.
 */
@Injectable({ providedIn: 'root' })
export class UserActivityService {
  private movements = inject(InventoryMovementService)

  getByUser(userId: string, page = 1, limit = 10): Observable<InventoryMovementListResponse> {
    return this.movements.list({ userId, page, limit })
  }
}
