export default function parseDateToIso(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Se já estiver em ISO, retorna direto
  if (dateStr.includes('-') && dateStr.length >= 10) {
    const [year, month, day] = dateStr.split('-');
    if (year.length === 4 && month.length === 2 && day.length === 2) {
      return dateStr;
    }
  }

  // Tenta formato brasileiro DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    if (day?.length === 2 && month?.length === 2 && year?.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }

  // Tenta criar Date e formatar
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  console.warn('parseDateToIso: formato inválido →', dateStr);
  return null;
}
