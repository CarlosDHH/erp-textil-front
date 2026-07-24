/**
 * Constantes y utilidades compartidas del módulo de Lotes.
 * Se usan tanto en la tarjeta (swatch de color) como en el formulario
 * (selector de color dual y datalist de tipo de material).
 */

/** Tipos de material sugeridos. El usuario puede escribir uno nuevo si no aparece. */
export const MATERIAL_TYPES: readonly string[] = [
  'Lisa',
  'Mezclilla',
  'Metálico',
  'Plástico',
  'Estampada',
  'Rayada',
  'Cuadros',
  'Bordada',
  'Punto',
  'Encaje',
] as const;

/** Mapa de nombres de color en español → hexadecimal para poder pintar el swatch. */
const COLOR_NAME_MAP: Record<string, string> = {
  rojo: '#dc2626',
  'rojo oscuro': '#991b1b',
  azul: '#2563eb',
  'azul marino': '#1e3a8a',
  'azul cielo': '#38bdf8',
  celeste: '#7dd3fc',
  verde: '#16a34a',
  'verde oscuro': '#166534',
  'verde limón': '#84cc16',
  'verde limon': '#84cc16',
  amarillo: '#eab308',
  naranja: '#f97316',
  morado: '#9333ea',
  violeta: '#7c3aed',
  rosa: '#ec4899',
  rosado: '#f472b6',
  café: '#92400e',
  cafe: '#92400e',
  marrón: '#78350f',
  marron: '#78350f',
  beige: '#e7d3b3',
  gris: '#6b7280',
  'gris claro': '#d1d5db',
  'gris oscuro': '#374151',
  negro: '#111827',
  blanco: '#f9fafb',
  dorado: '#d4af37',
  plateado: '#c0c0c0',
  turquesa: '#14b8a6',
  vino: '#7f1d1d',
  crema: '#fdf6e3',
};

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Indica si el valor es un hexadecimal válido (#rgb o #rrggbb). */
export function isHexColor(value?: string): boolean {
  return !!value && HEX_PATTERN.test(value.trim());
}

/** Normaliza un #rgb a #rrggbb (formato requerido por <input type="color">). */
function expandHex(hex: string): string {
  if (hex.length === 4) {
    return (
      '#' +
      hex
        .slice(1)
        .split('')
        .map((c) => c + c)
        .join('')
    );
  }
  return hex.toLowerCase();
}

/**
 * Devuelve un color CSS válido para pintar el swatch a partir de un hexadecimal
 * o de un nombre en español. Si no se reconoce, devuelve el valor tal cual
 * (CSS lo ignorará si es inválido, dejando el swatch transparente).
 */
export function resolveSwatchColor(value?: string): string {
  if (!value) return 'transparent';
  const raw = value.trim();
  if (isHexColor(raw)) return expandHex(raw);
  return COLOR_NAME_MAP[raw.toLowerCase()] ?? raw;
}

/**
 * Devuelve un hexadecimal válido (#rrggbb) para alimentar el <input type="color">.
 * Si el valor es un nombre en español conocido lo traduce; de lo contrario usa el fallback.
 */
export function toHexColor(value?: string, fallback = '#2563eb'): string {
  if (!value) return fallback;
  const raw = value.trim();
  if (isHexColor(raw)) return expandHex(raw);
  return COLOR_NAME_MAP[raw.toLowerCase()] ?? fallback;
}
