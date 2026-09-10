'use client';

import { cn, statusConfig, type YearStatus } from '@/lib/utils';

interface YearData {
  year: number;
  status: string;
  summary: string;
  eventCount: number;
  reasons?: string[];
}

interface YearTimelineProps {
  years: YearData[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
}

const statusEmoji: Record<YearStatus, string> = {
  GOOD: '🟢',
  STABLE: '🟢',
  WATCH: '🟡',
  CONCERN: '🟠',
  CRITICAL: '🔴',
};

export function YearTimeline({ years, selectedYear, onSelectYear }: YearTimelineProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start gap-0 min-w-max px-4 py-2">
        {years.map((yearData, index) => {
          const status = yearData.status as YearStatus;
          const cfg = statusConfig[status] ?? statusConfig.STABLE;
          const isSelected = selectedYear === yearData.year;
          const isFirst = index === 0;
          const isLast = index === years.length - 1;

          return (
            <div key={yearData.year} className="flex items-center">
              {/* Connector line before (not for first) */}
              {!isFirst && (
                <div className="w-8 h-0.5 bg-border mt-[-40px]" />
              )}

              {/* Year node */}
              <button
                onClick={() => onSelectYear(yearData.year)}
                className="flex flex-col items-center gap-2 group focus:outline-none"
                aria-label={`${yearData.year}: ${cfg.label}`}
                aria-pressed={isSelected}
              >
                {/* Bubble */}
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-200 cursor-pointer',
                    'group-hover:scale-105 group-hover:shadow-md',
                    isSelected
                      ? `border-current shadow-lg ring-4 ring-offset-2 ${cfg.ring} scale-110`
                      : 'border-transparent bg-gray-50 group-hover:bg-white',
                    isSelected ? cfg.bg : ''
                  )}
                  style={isSelected ? { borderColor: cfg.color } : {}}
                >
                  <span className="text-base leading-none">{statusEmoji[status]}</span>
                  <span
                    className={cn(
                      'text-xs font-bold leading-none mt-1',
                      isSelected ? cfg.text : 'text-gray-500'
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Year label */}
                <div className="text-center">
                  <span
                    className={cn(
                      'text-sm font-bold transition-colors',
                      isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {yearData.year}
                  </span>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {yearData.eventCount} events
                  </p>
                </div>
              </button>

              {/* Connector line after (not for last) */}
              {!isLast && (
                <div className="w-8 h-0.5 bg-border mt-[-40px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline legend
export function YearStatusLegend() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {(Object.entries(statusConfig) as [YearStatus, typeof statusConfig.GOOD][]).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{statusEmoji[key]}</span>
          <span className={cn('font-medium', cfg.text)}>{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}
