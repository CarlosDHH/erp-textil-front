import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

/**
 * Patrón estricto de correo electrónico.
 *
 * `Validators.email` de Angular es deliberadamente permisivo y acepta valores
 * como `usuario@dominio` (sin TLD) o `a@b`, que después el backend guarda tal cual.
 * Este patrón exige: usuario + '@' + dominio + '.' + extensión de 2 a 4 letras.
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/

/**
 * Validador estricto de correo. Devuelve `{ email: true }` para mantener la misma
 * clave de error que `Validators.email`, de modo que las plantillas existentes
 * no necesitan cambiar la condición que muestran.
 *
 * No valida el campo vacío: eso corresponde a `Validators.required`.
 */
export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim()
    if (!value) return null
    return EMAIL_PATTERN.test(value) ? null : { email: true }
  }
}
