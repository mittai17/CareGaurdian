import { cn, statusConfig, type YearStatus } from '@/lib/utils';
import { TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

interface HealthMetricCardProps {
  label: string;
  current: string | number;
  baseline?: string | number;
  baselineLabel?: string;
  change?: number | null;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral' | null;
  invertTrend?: boolean; // for metrics where down = good (e.g., confusion reports)
  confidence?: string;
  className?: string;
}

export function HealthMetricCard({
  label,
  current,
  baseline,
  baselineLabel,
  change,
  unit = '',
  trend,
  invertTrend = false,
  confidence,
  className,
}: HealthMetricCardProps) {
  const isNegative = trend === 'down' && !invertTrend || (trend === 'up' && invertTrend);
  const isPositive = trend === 'up' && !invertTrend || (trend === 'down' && invertTrend);

  return (
    <div className={cn('rounded-xl border bg-card p-4 card-hover', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-foreground leading-none">
            {typeof current === 'number' ? current.toLocaleString() : current}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {(baseline !== undefined || baselineLabel !== undefined) && (
            <p className="text-xs text-muted-foreground mt-1">
              Baseline {baselineLabel ?? (typeof baseline === 'number' ? baseline.toLocaleString() : baseline)}
              {unit && !baselineLabel && ` ${unit}`}
            </p>
          )}
        </div>
        {change !== null && change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-semibold rounded-lg px-2 py-1',
              isNegative ? 'bg-red-50 text-red-600' : isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'
            )}
          >
            {trend === 'down' ? (
              <TrendingDown className="h-4 w-4" />
            ) : trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            <span>{change > 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      {confidence === 'LOW' && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Limited data
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: YearStatus;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

export function StatusBadge({ status, size = 'md', showEmoji = true }: StatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        cfg.bg, cfg.text, cfg.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-2.5 py-1 text-xs'
      )}
      role="status"
      aria-label={`Status: ${cfg.label}`}
    >
      {showEmoji && <span aria-hidden="true">{cfg.emoji}</span>}
      {cfg.label}
    </span>
  );
}
