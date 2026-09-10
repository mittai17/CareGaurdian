import type { Severity, YearStatus } from '@baseline/types';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(iso);
}

export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    NORMAL: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    ATTENTION: 'bg-amber-100 border-amber-400 text-amber-800',
    REVIEW: 'bg-orange-100 border-orange-400 text-orange-800',
    CRITICAL: 'bg-red-100 border-red-400 text-red-800',
    UNKNOWN: 'bg-gray-100 border-gray-400 text-gray-600',
  };
  return map[severity] ?? map.UNKNOWN;
}

export function severityTextColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    NORMAL: 'text-emerald-700',
    ATTENTION: 'text-amber-700',
    REVIEW: 'text-orange-700',
    CRITICAL: 'text-red-700',
    UNKNOWN: 'text-gray-500',
  };
  return map[severity] ?? map.UNKNOWN;
}

export function severityIcon(severity: Severity): string {
  const map: Record<Severity, string> = {
    NORMAL: 'checkmark-circle',
    ATTENTION: 'alert-circle',
    REVIEW: 'warning',
    CRITICAL: 'alert-circle',
    UNKNOWN: 'help-circle',
  };
  return map[severity] ?? map.UNKNOWN;
}

export function severityLabel(severity: Severity): string {
  const map: Record<Severity, string> = {
    NORMAL: 'Normal',
    ATTENTION: 'Attention',
    REVIEW: 'Review',
    CRITICAL: 'Critical',
    UNKNOWN: 'Unknown',
  };
  return map[severity] ?? 'Unknown';
}

export function formatSimilarity(score: number): string {
  return `${(score * 100).toFixed(0)}% match`;
}

export function formatConfidence(level: string): string {
  const map: Record<string, string> = {
    LOW: 'Low confidence',
    MODERATE: 'Moderate confidence',
    HIGH: 'High confidence',
    INSUFFICIENT_DATA: 'Insufficient data',
  };
  return map[level] ?? level;
}

export function categoryLabel(cat: string): string {
  return cat
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function yearStatusColor(status: YearStatus): string {
  const map: Record<YearStatus, string> = {
    GOOD: 'bg-emerald-100 border-emerald-400 text-emerald-800',
    STABLE: 'bg-green-100 border-green-400 text-green-800',
    WATCH: 'bg-amber-100 border-amber-400 text-amber-800',
    CONCERN: 'bg-orange-100 border-orange-400 text-orange-800',
    CRITICAL: 'bg-red-100 border-red-400 text-red-800',
  };
  return map[status];
}

export function yearStatusTextColor(status: YearStatus): string {
  const map: Record<YearStatus, string> = {
    GOOD: 'text-emerald-700',
    STABLE: 'text-green-700',
    WATCH: 'text-amber-700',
    CONCERN: 'text-orange-700',
    CRITICAL: 'text-red-700',
  };
  return map[status];
}

export function yearStatusIcon(status: YearStatus): string {
  const map: Record<YearStatus, string> = {
    GOOD: 'checkmark-circle',
    STABLE: 'shield-checkmark',
    WATCH: 'time',
    CONCERN: 'warning',
    CRITICAL: 'alert-circle',
  };
  return map[status];
}

export function yearStatusDot(status: YearStatus): string {
  const map: Record<YearStatus, string> = {
    GOOD: '#059669',
    STABLE: '#16a34a',
    WATCH: '#d97706',
    CONCERN: '#ea580c',
    CRITICAL: '#dc2626',
  };
  return map[status];
}
