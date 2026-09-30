/** Display for an unavailable value. */
export const UNAVAILABLE_VALUE = "—";

export function formatValue(value: number | null): string {
  return value === null ? UNAVAILABLE_VALUE : value.toFixed(1);
}
