import { Injectable, inject } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs'

import { RoleService, Role } from '../../roles/services/role.service'
import { UserService, User } from '../../users/services/user.service'
import { SupplyService } from '../../supplies/services/supply'
import { Supply } from '../../supplies/models/supply.model'
import {
  DISCOUNT_MOVEMENT_TYPES,
  InventoryMovement,
  InventoryMovementService,
} from '../../../core/services/inventory-movement.service'
import { categoryLabel, unitLabel } from '../../../core/utils/inventory-labels'
import {
  ChartPoint,
  ChartSeries,
  DashboardSummary,
  DiscountRange,
  DiscountSummary,
  InsumoResumen,
  KpiMetric,
  SupplyDiscountRow,
} from '../models/dashboard.model'

/** Large enough page size to fetch the full catalog in a single request for this ERP's scale. */
const FETCH_ALL_LIMIT = 1000

/**
 * Builds dashboard metrics by combining the existing /users, /roles and /supply
 * endpoints — the backend has no dedicated /dashboard endpoint. All KPIs and chart
 * data below are computed from real records, no static/mock data is used.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private userService = inject(UserService)
  private roleService = inject(RoleService)
  private supplyService = inject(SupplyService)
  private movementService = inject(InventoryMovementService)

  getSummary(): Observable<DashboardSummary> {
    return forkJoin({
      users: this.userService.getAll(1, FETCH_ALL_LIMIT),
      roles: this.roleService.getAll(1, FETCH_ALL_LIMIT),
      supplies: this.supplyService.getSupplies(1, FETCH_ALL_LIMIT),
    }).pipe(
      map(({ users, roles, supplies }) => {
        const userList: User[] = users.data.data
        const roleList: Role[] = roles.data.data
        const roleCount: number = roles.data.meta?.total ?? roleList.length
        const supplyList: Supply[] = supplies.data.data
        // Total real de insumos (usa el conteo del backend, no el largo de la página).
        const supplyCount: number = supplies.data.meta?.total ?? supplyList.length

        return {
          kpis: this.buildKpis(userList, roleCount, supplyList, roleList, supplyCount),
          suppliesTrend: this.buildSuppliesTrend(supplyList),
          supplyDistribution: this.buildSupplyDistribution(supplyList),
          usersByRole: this.buildUsersByRole(userList),
          dailySummary: this.buildDailySummary(supplyList),
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    )
  }

  private buildKpis(
    users: User[],
    roleCount: number,
    supplies: Supply[],
    roles: Role[],
    supplyCount: number,
  ): KpiMetric[] {
    const activeUsers = users.filter((user) => user.active).length
    const lowStockSupplies = supplies.filter((supply) => supply.currentStock <= supply.minStock)
    // Filtrado en el frontend (no se muta `roles`): conserva estrictamente los roles con isActive === true.
    const activeRolesCount = roles.filter((role) => role.isActive === true).length

    return [
      {
        id: 'total-supplies',
        label: 'Total Insumos',
        value: supplyCount,
        icon: 'box',
        status: 'info',
      },
      {
        id: 'low-stock',
        label: 'Stock Crítico',
        value: lowStockSupplies.length,
        icon: 'exclamation-triangle',
        helperText: `${lowStockSupplies.length} de ${supplies.length} insumos`,
        status: lowStockSupplies.length > 0 ? 'danger' : 'success',
      },
      {
        id: 'active-users',
        label: 'Usuarios Activos',
        value: activeUsers,
        icon: 'users',
        helperText: `${activeUsers} de ${users.length} usuarios`,
        status: 'info',
      },
      {
        id: 'total-roles',
        label: 'Roles Registrados',
        value: roleCount,
        icon: 'shield',
        status: 'info',
      },
      {
        id: 'active-roles',
        label: 'Roles Activos',
        value: activeRolesCount,
        icon: 'check-circle',
        helperText: `${activeRolesCount} de ${roleCount} roles`,
        status: 'info',
      },
    ]
  }

  /** Groups supplies by the month they were registered (Supply.createdAt), sorted chronologically. */
  private buildSuppliesTrend(supplies: Supply[]): ChartSeries[] {
    const withDate = supplies.filter((supply) => !!supply.createdAt)
    const counts = new Map<string, number>()

    for (const supply of withDate) {
      const key = this.monthKey(new Date(supply.createdAt as string))
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const points: ChartPoint[] = Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ name: this.formatMonthLabel(key), value }))

    return [{ name: 'Insumos registrados', series: points }]
  }

  private buildSupplyDistribution(supplies: Supply[]): ChartPoint[] {
    const totalsByType = new Map<string, number>()

    for (const supply of supplies) {
      // Sin normalizar, 'fabric' (carga inicial) y 'Telas' (alta desde la app)
      // aparecían como dos porciones distintas de la misma categoría.
      const type = categoryLabel(supply.type) || 'Sin tipo'
      totalsByType.set(type, (totalsByType.get(type) ?? 0) + 1)
    }

    return Array.from(totalsByType.entries()).map(([name, value]) => ({ name, value }))
  }

  private buildUsersByRole(users: User[]): ChartPoint[] {
    const countsByRole = new Map<string, number>()

    for (const user of users) {
      const role = user.role || 'Sin rol'
      countsByRole.set(role, (countsByRole.get(role) ?? 0) + 1)
    }

    return Array.from(countsByRole.entries()).map(([name, value]) => ({ name, value }))
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  private formatMonthLabel(key: string): string {
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
  }
/** Insumos cuya fecha de registro (createdAt) corresponde al día de hoy. */
  private buildDailySummary(supplies: Supply[]): InsumoResumen[] {
    const today = new Date()

    return supplies
      .filter((supply) => supply.createdAt && this.isSameDay(new Date(supply.createdAt), today))
      .map((supply) => ({
        name: supply.name,
        quantity: supply.currentStock,
        unit: unitLabel(supply.unitMeasure),
      }))
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }


  /**
   * Resumen de descontación de insumos del día o de la semana en curso.
   *
   * Consulta `/inventoryMovement` filtrando por tipo (`exit`, `loss`) y por rango
   * de fechas —el filtrado ocurre en el backend— y agrupa por insumo para
   * responder "qué salió del almacén y cuánto".
   */
  getDiscountSummary(range: DiscountRange = 'day'): Observable<DiscountSummary> {
    const { from, to } = this.resolveRange(range)

    return this.movementService
      .list({
        types: DISCOUNT_MOVEMENT_TYPES,
        from,
        to,
        page: 1,
        limit: FETCH_ALL_LIMIT,
      })
      .pipe(
        map((res) => this.buildDiscountSummary(res.data.data, range, from, to)),
        catchError((error: HttpErrorResponse) => this.handleError(error)),
      )
  }

  /** Día en curso (00:00–23:59) o semana en curso empezando en lunes. */
  private resolveRange(range: DiscountRange): { from: Date; to: Date } {
    const from = new Date()
    from.setHours(0, 0, 0, 0)

    if (range === 'week') {
      // getDay(): 0 = domingo. Se retrocede hasta el lunes de esta semana.
      const daysSinceMonday = (from.getDay() + 6) % 7
      from.setDate(from.getDate() - daysSinceMonday)
    }

    const to = new Date()
    to.setHours(23, 59, 59, 999)

    return { from, to }
  }

  private buildDiscountSummary(
    movements: InventoryMovement[],
    range: DiscountRange,
    from: Date,
    to: Date,
  ): DiscountSummary {
    const rowsBySupply = new Map<string, SupplyDiscountRow>()
    let totalLoss = 0

    for (const movement of movements) {
      const quantity = Number(movement.quantity ?? 0)
      // Los insumos sin id se agrupan por nombre para no perder el movimiento.
      const key = movement.supplyId ?? movement.supplyName ?? movement.batchId ?? movement.id

      const row = rowsBySupply.get(key) ?? {
        supplyId: movement.supplyId ?? key,
        supplyName: movement.supplyName ?? 'Insumo sin nombre',
        // Los insumos de la carga inicial traen la unidad en inglés ('piece').
        unitMeasure: unitLabel(movement.unitMeasure),
        total: 0,
        exitTotal: 0,
        lossTotal: 0,
        movements: 0,
      }

      row.total += quantity
      row.movements += 1
      if (movement.type === 'loss') {
        row.lossTotal += quantity
        totalLoss += quantity
      } else {
        row.exitTotal += quantity
      }

      rowsBySupply.set(key, row)
    }

    return {
      range,
      from,
      to,
      // De mayor a menor consumo: lo más descontado encabeza la lista.
      rows: Array.from(rowsBySupply.values()).sort((a, b) => b.total - a.total),
      totalMovements: movements.length,
      totalLoss,
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('DashboardService error:', error)
    const message =
      error.error?.message ?? 'No se pudo cargar la información del dashboard. Intenta nuevamente.'
    return throwError(() => new Error(message))
  }
}

