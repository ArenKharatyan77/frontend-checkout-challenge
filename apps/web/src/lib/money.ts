const formatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function formatMoney(kopecks: number): string {
  return formatter.format(kopecks / 100);
}
