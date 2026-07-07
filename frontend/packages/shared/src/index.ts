export * from './types';

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getProjectStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Entwurf',
    PENDING_REVIEW: 'In Prüfung',
    PUBLISHED: 'Ausgeschrieben',
    IN_OFFER_PHASE: 'Angebotsphase',
    IN_EXECUTION: 'In Ausführung',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
    ARCHIVED: 'Archiviert',
  };
  return labels[status] || status;
};

export const getOfferStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Entwurf',
    SENT: 'Gesendet',
    VIEWED: 'Angesehen',
    ACCEPTED: 'Angenommen',
    REJECTED: 'Abgelehnt',
    EXPIRED: 'Abgelaufen',
    COUNTERED: 'Gegenvorschlag',
    WITHDRAWN: 'Zurückgezogen',
  };
  return labels[status] || status;
};

export const getEscrowStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING_FUNDING: 'Ausstehende Einzahlung',
    FUNDED: 'Eingezahlt',
    PARTIALLY_RELEASED: 'Teilweise freigegeben',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
    DISPUTED: 'Streitfall',
  };
  return labels[status] || status;
};

export const getInvoiceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Entwurf',
    SENT: 'Gesendet',
    REMINDED: 'Erinnert',
    OVERDUE: 'Überfällig',
    PARTIALLY_PAID: 'Teilweise bezahlt',
    PAID: 'Bezahlt',
    CANCELLED: 'Storniert',
    CREDITED: 'Gutschrift',
  };
  return labels[status] || status;
};

export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mindestens 8 Zeichen');
  if (!/[A-Z]/.test(password)) errors.push('Ein Großbuchstabe');
  if (!/[a-z]/.test(password)) errors.push('Ein Kleinbuchstabe');
  if (!/[0-9]/.test(password)) errors.push('Eine Zahl');
  return { valid: errors.length === 0, errors };
};
