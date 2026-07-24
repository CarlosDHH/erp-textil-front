/**
 * Normalización de las etiquetas de inventario.
 *
 * La base de datos convive con dos vocabularios: el de la carga inicial, en
 * inglés (`piece`, `meter`, `fabric`…), y el que escriben los formularios de la
 * aplicación, en español (`Piezas`, `Metros`, `Telas`). Sin traducir, la interfaz
 * mezcla ambos y muestra cosas como «− 50 piece».
 *
 * Estas funciones solo afectan a la presentación: el valor guardado no se toca.
 */

const UNIT_LABELS: Record<string, string> = {
  piece: 'Piezas',
  pieces: 'Piezas',
  meter: 'Metros',
  meters: 'Metros',
  metre: 'Metros',
  cone: 'Conos',
  cones: 'Conos',
  kg: 'Kilogramos',
  kilogram: 'Kilogramos',
  kilograms: 'Kilogramos',
  roll: 'Rollos',
  rolls: 'Rollos',
  liter: 'Litros',
  liters: 'Litros',
  litre: 'Litros',
}

const CATEGORY_LABELS: Record<string, string> = {
  fabric: 'Telas',
  thread: 'Hilos',
  zipper: 'Cierres',
  button: 'Botones',
  interfacing: 'Entretela',
  ink: 'Tinta',
  stationery: 'Papelería',
  accessory: 'Accesorios',
  other: 'Otros',
  // Singulares en español: hay registros escritos a mano como «Tela» que, sin
  // unificar, salían como una categoría aparte de «Telas» en la gráfica.
  tela: 'Telas',
  hilo: 'Hilos',
  cierre: 'Cierres',
  boton: 'Botones',
  botón: 'Botones',
  accesorio: 'Accesorios',
}

/**
 * Devuelve la unidad de medida en español.
 * Si el valor ya está en español (o no se reconoce) se devuelve tal cual, para
 * no ocultar datos que el usuario haya escrito a mano.
 */
export function unitLabel(unit?: string | null): string {
  if (!unit) return ''
  return UNIT_LABELS[unit.trim().toLowerCase()] ?? unit
}

/** Devuelve la categoría del insumo en español, con el mismo criterio. */
export function categoryLabel(type?: string | null): string {
  if (!type) return ''
  return CATEGORY_LABELS[type.trim().toLowerCase()] ?? type
}
