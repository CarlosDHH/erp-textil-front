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

/** Rango temporal del panel de descontación. */
export type DiscountRange = 'day' | 'week'

/** Un insumo con el total descontado en el periodo consultado. */
export interface SupplyDiscountRow {
  supplyId: string
  supplyName: string
  unitMeasure: string
  /** Total descontado en el periodo (salidas + mermas). */
  total: number
  /** Parte del total que corresponde a salidas normales. */
  exitTotal: number
  /** Parte del total que corresponde a mermas (desperdicio). */
  lossTotal: number
  /** Número de movimientos que componen el total. */
  movements: number
}

/**
 * Resumen de descontación de insumos: qué salió del almacén en el periodo,
 * calculado a partir de los movimientos de tipo `exit` y `loss`.
 */
export interface DiscountSummary {
  range: DiscountRange
  from: Date
  to: Date
  rows: SupplyDiscountRow[]
  /** Movimientos totales del periodo. */
  totalMovements: number
  /** Suma de mermas del periodo (en unidades, mezclando unidades de medida). */
  totalLoss: number
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

