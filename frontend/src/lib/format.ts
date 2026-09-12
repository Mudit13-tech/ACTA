export const inr = (n: number): string =>
  '₹' + Math.round(n).toLocaleString('en-IN');

export const inrCompact = (n: number): string => {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return '₹' + n;
};

export const timeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export const dayOf = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return 'Today';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const discountPct = (price: number, listPrice: number): number =>
  listPrice <= 0 ? 0 : Math.round(((listPrice - price) / listPrice) * 100);
