import { Injectable, inject } from '@angular/core'
import { Store } from '@ngrx/store'
import { firstValueFrom } from 'rxjs'
import { take } from 'rxjs/operators'
import jsPDF from 'jspdf'
import autoTable, { RowInput, UserOptions } from 'jspdf-autotable'

import { selectUser } from '../../features/auth/store/auth.selectors'
import { AuthUser } from '../../features/auth/store/auth.state'

/** Ruta del logo institucional (se sirve desde /public). */
const LOGO_URL = 'icons/logopantsys.svg'

/** Paleta corporativa del reporte, en RGB para jsPDF. */
const COLORS = {
  ink: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  primary: [37, 99, 235] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
}

const MARGIN = 14

export interface ReportColumn<T> {
  header: string
  /** Valor de la celda ya formateado. */
  value: (row: T) => string
  /** Ancho fijo en mm; si se omite, autoTable lo reparte. */
  width?: number
  align?: 'left' | 'right' | 'center'
}

export interface ReportOptions<T> {
  /** Título grande del documento, ej. "Inventario de Insumos". */
  title: string
  /** Línea de contexto bajo el título. */
  subtitle?: string
  columns: ReportColumn<T>[]
  rows: T[]
  /** Nombre del archivo sin extensión. */
  fileName: string
  orientation?: 'portrait' | 'landscape'
  /** Pares "etiqueta: valor" que se imprimen como resumen sobre la tabla. */
  totals?: { label: string; value: string }[]
  /** Permite teñir una fila concreta, ej. stock por debajo del mínimo. */
  highlightRow?: (row: T) => boolean
}

/**
 * Generación de reportes PDF con la identidad de PantSys.
 *
 * Todos los reportes comparten cabecera (logo, título, fecha de generación y
 * responsable) y pie con paginación, de modo que cada módulo solo declara sus
 * columnas y sus filas.
 */
@Injectable({ providedIn: 'root' })
export class PdfReportService {
  private store = inject(Store)

  /** El logo se rasteriza una sola vez por sesión. */
  private logoPromise?: Promise<string | null>

  async generate<T>(options: ReportOptions<T>): Promise<void> {
    const doc = new jsPDF({
      orientation: options.orientation ?? 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const user = await this.currentUser()
    const generatedAt = new Date()
    const headerBottom = await this.drawHeader(doc, options, user, generatedAt)

    const startY = options.totals?.length
      ? this.drawTotals(doc, options.totals, headerBottom)
      : headerBottom

    autoTable(doc, this.tableOptions(options, startY))
    this.drawFooter(doc, generatedAt)

    doc.save(`${options.fileName}-${this.fileStamp(generatedAt)}.pdf`)
  }

  // ─── Cabecera ──────────────────────────────────────────────────────────────

  private async drawHeader<T>(
    doc: jsPDF,
    options: ReportOptions<T>,
    user: AuthUser | null,
    generatedAt: Date,
  ): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth()
    const logo = await this.logo()

    if (logo) {
      doc.addImage(logo, 'PNG', MARGIN, 12, 16, 16)
    }

    const textX = logo ? MARGIN + 21 : MARGIN

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...COLORS.ink)
    doc.text(options.title, textX, 19)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    doc.text(options.subtitle ?? 'PantSys · Sistema de gestión textil', textX, 25)

    // Bloque derecho: fecha de generación y responsable del reporte.
    const responsable = user ? `${user.name} ${user.lastName}` : 'Usuario no identificado'
    doc.setFontSize(8.5)
    doc.text(`Generado: ${this.formatDateTime(generatedAt)}`, pageWidth - MARGIN, 17, {
      align: 'right',
    })
    doc.text(`Responsable: ${responsable}`, pageWidth - MARGIN, 22, { align: 'right' })
    if (user?.role) {
      doc.text(`Rol: ${user.role}`, pageWidth - MARGIN, 27, { align: 'right' })
    }

    doc.setDrawColor(...COLORS.line)
    doc.setLineWidth(0.4)
    doc.line(MARGIN, 32, pageWidth - MARGIN, 32)

    return 38
  }

  /** Fila de totales sobre la tabla; devuelve la Y donde debe empezar la tabla. */
  private drawTotals(
    doc: jsPDF,
    totals: { label: string; value: string }[],
    y: number,
  ): number {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    let x = MARGIN
    for (const total of totals) {
      doc.setTextColor(...COLORS.muted)
      doc.text(`${total.label}:`, x, y)
      const labelWidth = doc.getTextWidth(`${total.label}: `)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLORS.ink)
      doc.text(total.value, x + labelWidth, y)
      const valueWidth = doc.getTextWidth(total.value)

      doc.setFont('helvetica', 'normal')
      x += labelWidth + valueWidth + 8
    }

    return y + 6
  }

  // ─── Tabla ─────────────────────────────────────────────────────────────────

  private tableOptions<T>(options: ReportOptions<T>, startY: number): UserOptions {
    const body: RowInput[] = options.rows.map((row) =>
      options.columns.map((column) => column.value(row)),
    )

    const columnStyles: UserOptions['columnStyles'] = {}
    options.columns.forEach((column, index) => {
      columnStyles[index] = {
        ...(column.width && { cellWidth: column.width }),
        ...(column.align && { halign: column.align }),
      }
    })

    return {
      startY,
      head: [options.columns.map((column) => column.header)],
      body,
      theme: 'striped',
      margin: { left: MARGIN, right: MARGIN, bottom: 20 },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.6,
        textColor: COLORS.ink,
        lineColor: COLORS.line,
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
      },
      alternateRowStyles: { fillColor: COLORS.zebra },
      columnStyles,
      // Las filas marcadas (ej. stock crítico) se tiñen de rojo.
      didParseCell: (data) => {
        if (data.section !== 'body' || !options.highlightRow) return
        const row = options.rows[data.row.index]
        if (row && options.highlightRow(row)) {
          data.cell.styles.textColor = COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }
      },
    }
  }

  // ─── Pie ───────────────────────────────────────────────────────────────────

  private drawFooter(doc: jsPDF, generatedAt: Date): void {
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pages = doc.getNumberOfPages()

    for (let page = 1; page <= pages; page++) {
      doc.setPage(page)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.muted)
      doc.text(
        `PantSys · Documento generado el ${this.formatDateTime(generatedAt)}`,
        MARGIN,
        pageHeight - 10,
      )
      doc.text(`Página ${page} de ${pages}`, pageWidth - MARGIN, pageHeight - 10, {
        align: 'right',
      })
    }
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────

  private async currentUser(): Promise<AuthUser | null> {
    return firstValueFrom(this.store.select(selectUser).pipe(take(1)))
  }

  /**
   * jsPDF no dibuja SVG, así que el logo se rasteriza a PNG en un canvas.
   * Se usa un data URL (mismo origen) para no contaminar el canvas y poder
   * exportarlo con toDataURL. Si algo falla, el reporte se emite sin logo.
   */
  private logo(): Promise<string | null> {
    this.logoPromise ??= this.rasterizeLogo().catch(() => null)
    return this.logoPromise
  }

  private async rasterizeLogo(): Promise<string | null> {
    const response = await fetch(LOGO_URL)
    if (!response.ok) return null

    const svg = await response.text()
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo cargar el logo'))
      img.src = dataUrl
    })

    // 256 px es suficiente para 16 mm impresos sin que el PDF crezca de más.
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const context = canvas.getContext('2d')
    if (!context) return null

    context.drawImage(image, 0, 0, size, size)
    return canvas.toDataURL('image/png')
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /** Sufijo aaaa-mm-dd para el nombre del archivo. */
  private fileStamp(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
  }
}
