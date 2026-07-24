import { Injectable } from '@angular/core'
import Swal, { SweetAlertResult } from 'sweetalert2'

/**
 * Fachada de SweetAlert2 con la paleta del ERP ya aplicada.
 *
 * Centralizar aquí los modales evita que cada componente repita colores y textos,
 * y sustituye a `window.confirm()`, que no es estilizable ni accesible al teclado
 * dentro de la app.
 *
 * Paleta (src/styles/_variables.scss):
 *   éxito #22C55E · peligro #EF4444 · primario #3B82F6 · advertencia #F59E0B
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly palette = {
    success: '#22C55E',
    danger: '#EF4444',
    primary: '#3B82F6',
    warning: '#F59E0B',
    neutral: '#64748B',
  }

  /** Opciones comunes: tipografía y bordes redondeados del sistema. */
  private readonly base = {
    buttonsStyling: true,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup: 'erp-swal-popup',
      title: 'erp-swal-title',
      htmlContainer: 'erp-swal-text',
      confirmButton: 'erp-swal-button',
      cancelButton: 'erp-swal-button',
    },
  }

  /**
   * Confirmación de borrado. El botón destructivo va en rojo y el foco inicial
   * está en «Cancelar» para que un Enter accidental no elimine nada.
   */
  confirmDelete(options: {
    title?: string
    text: string
    confirmText?: string
  }): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'warning',
      iconColor: this.palette.warning,
      title: options.title ?? '¿Eliminar registro?',
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: this.palette.danger,
      cancelButtonColor: this.palette.neutral,
    })
  }

  /** Confirmación genérica (no destructiva), en el azul primario del sistema. */
  confirm(options: {
    title: string
    text: string
    confirmText?: string
  }): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'question',
      iconColor: this.palette.primary,
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: this.palette.primary,
      cancelButtonColor: this.palette.neutral,
    })
  }

  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'success',
      iconColor: this.palette.success,
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.palette.success,
      timer: 2200,
      timerProgressBar: true,
    })
  }

  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'error',
      iconColor: this.palette.danger,
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.palette.danger,
    })
  }

  /**
   * Alerta específica de inventario: el backend rechazó la operación por falta
   * de existencias. Se muestra con detalle de lo solicitado vs. lo disponible
   * cuando el backend lo informa.
   */
  insufficientStock(detail?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'error',
      iconColor: this.palette.danger,
      title: 'Material insuficiente',
      text: detail ?? 'La cantidad solicitada supera el stock disponible del insumo.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: this.palette.danger,
    })
  }

  /** Notificación discreta en la esquina, sin bloquear la interacción. */
  toast(title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success'): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      iconColor: icon === 'error' ? this.palette.danger : this.palette.success,
      title,
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      customClass: { popup: 'erp-swal-toast' },
    })
  }
}
