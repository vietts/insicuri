export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'ora';
  if (minutes < 60) return `${minutes}m fa`;
  if (hours < 24) return `${hours}h fa`;
  if (days < 30) return `${days}g fa`;
  return formatDate(dateStr);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
