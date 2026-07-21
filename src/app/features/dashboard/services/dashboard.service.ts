import { Injectable, inject } from '@angular/core'
import { HttpErrorResponse } from '@angular/common/http'
import { Observable, catchError, forkJoin, map, throwError } from 'rxjs'

import { RoleService, Role } from '../../roles/services/role.service'
import { UserService, User } from '../../users/services/user.service'
import { SupplyService } from '../../supplies/services/supply'
import { Supply } from '../../supplies/models/supply.model'
import { ChartPoint, ChartSeries, DashboardSummary, InsumoResumen, KpiMetric } from '../models/dashboard.model'

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

        return {
          kpis: this.buildKpis(userList, roleCount, supplyList, roleList),
          suppliesTrend: this.buildSuppliesTrend(supplyList),
          supplyDistribution: this.buildSupplyDistribution(supplyList),
          usersByRole: this.buildUsersByRole(userList),
          dailySummary: this.buildDailySummary(supplyList),
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
    )
  }

  private buildKpis(users: User[], roleCount: number, supplies: Supply[], roles: Role[]): KpiMetric[] {
    const activeUsers = users.filter((user) => user.active).length
    const lowStockSupplies = supplies.filter((supply) => supply.currentStock <= supply.minStock)
    // Filtrado en el frontend (no se muta `roles`): conserva estrictamente los roles con isActive === true.
    const activeRolesCount = roles.filter((role) => role.isActive === true).length

    return [
      {
        id: 'total-supplies',
        label: 'Total Insumos',
        value: supplies.length,
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
      const type = supply.type || 'Sin tipo'
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
        unit: supply.unitMeasure,
      }))
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }


  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('DashboardService error:', error)
    const message =
      error.error?.message ?? 'No se pudo cargar la información del dashboard. Intenta nuevamente.'
    return throwError(() => new Error(message))
  }
}

