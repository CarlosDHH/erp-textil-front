/**
 * View models consumed by the dashboard UI (KPI cards + charts).
 * These are computed by DashboardService from the existing /users, /roles and
 * /supply endpoints — there is no dedicated /dashboard endpoint in the backend.
 */

export type KpiStatus = 'success' | 'warning' | 'danger' | 'info'

export interface KpiMetric {
  id: string
  label: string
  value: number
  unit?: string
  icon: string
  /** Optional descriptive context, e.g. "3 de 48 insumos". No fake trend/variation is invented. */
  helperText?: string
  status: KpiStatus
}

export interface ChartPoint {
  name: string
  value: number
}

export interface ChartSeries {
  name: string
  series: ChartPoint[]
}

/** Item shown in the "Resumen del día" panel — an insumo registered today. */
export interface InsumoResumen {
  name: string
  quantity: number
  unit: string
}

export interface DashboardSummary {
  kpis: KpiMetric[]
  /** Insumos registrados por mes (derivado de Supply.createdAt). */
  suppliesTrend: ChartSeries[]
  /** Insumos agrupados por tipo (derivado de Supply.type). */
  supplyDistribution: ChartPoint[]
  /** Usuarios agrupados por rol (derivado de User.role). */
  usersByRole: ChartPoint[]
  /** Insumos registrados el día de hoy (derivado de Supply.createdAt), para el panel "Resumen del día". */
  dailySummary: InsumoResumen[]
}

