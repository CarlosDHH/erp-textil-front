/**
 * Configuración compartida de categorías de insumos (en español).
 * Cada categoría define su unidad de medida sugerida y el prefijo del código,
 * lo que permite la congruencia categoría→unidad y la auto-generación del código.
 */
export interface CategoryConfig {
  /** Etiqueta en español; es también el valor que se guarda en el backend. */
  label: string;
  /**
   * Unidades de medida permitidas para la categoría, en orden de preferencia.
   * La primera es la que se preselecciona al elegir la categoría y el selector
   * de unidad **solo** ofrece las de esta lista (congruencia estricta).
   */
  units: readonly string[];
  /** Prefijo usado al sugerir el código identificador (ej. BOT-001). */
  prefix: string;
}

export const SUPPLY_CATEGORIES: readonly CategoryConfig[] = [
  { label: 'Telas', units: ['Metros', 'Kilogramos'], prefix: 'TEL' },
  { label: 'Hilos', units: ['Conos', 'Piezas'], prefix: 'HIL' },
  { label: 'Botones', units: ['Piezas'], prefix: 'BOT' },
  { label: 'Cierres', units: ['Piezas'], prefix: 'CIE' },
  { label: 'Entretela', units: ['Metros', 'Rollos'], prefix: 'ENT' },
  { label: 'Papelería', units: ['Piezas'], prefix: 'PAP' },
  { label: 'Accesorios', units: ['Piezas'], prefix: 'ACC' },
  { label: 'Tinta', units: ['Litros'], prefix: 'TIN' },
  { label: 'Otros', units: ['Piezas', 'Metros', 'Conos', 'Kilogramos', 'Litros', 'Rollos'], prefix: 'OTR' },
] as const;

/** Catálogo completo de unidades; se usa como respaldo si no hay categoría elegida. */
export const SUPPLY_UNITS: readonly string[] = [
  'Metros',
  'Piezas',
  'Conos',
  'Kilogramos',
  'Litros',
  'Rollos',
] as const;

/** Devuelve la configuración de una categoría por su etiqueta. */
export function findCategoryConfig(label: string): CategoryConfig | undefined {
  return SUPPLY_CATEGORIES.find((c) => c.label === label);
}

/**
 * Unidades permitidas para una categoría. Sin categoría seleccionada devuelve
 * el catálogo completo (para no dejar el selector vacío en un formulario nuevo).
 */
export function unitsForCategory(label?: string): readonly string[] {
  return findCategoryConfig(label ?? '')?.units ?? SUPPLY_UNITS;
}

/** Indica si la unidad es congruente con la categoría (usado por el validador cruzado). */
export function isUnitAllowedForCategory(label: string, unit: string): boolean {
  const config = findCategoryConfig(label);
  // Sin categoría conocida no se puede afirmar incongruencia: no se bloquea.
  if (!config) return true;
  return config.units.includes(unit);
}
