export function painLabel(value: number): string {
  if (value === 0) return 'Sin dolor';
  if (value <= 3) return 'Leve';
  if (value <= 6) return 'Moderado';
  if (value <= 8) return 'Intenso';
  return 'Muy intenso';
}
