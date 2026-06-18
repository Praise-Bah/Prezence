import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface DashboardStatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  trend?: { text: string; positive: boolean };
  footer?: ReactNode;
  className?: string;
}

export function DashboardStatCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  footer,
  className,
}: DashboardStatCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-[196px] flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-[18px] shadow-sm',
        className,
      )}
    >
      <div>
        <div
          className="mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <p className="text-sm font-medium text-[#787c91]">{label}</p>
        <p className="mt-2.5 text-[34px] font-semibold leading-none text-[#1a1a2e]">{value}</p>
      </div>
      {trend && (
        <p
          className={cn(
            'mt-4 flex items-center gap-1 text-xs font-medium',
            trend.positive ? 'text-[#16a34a]' : 'text-[#dc2626]',
          )}
        >
          {trend.positive ? '↗' : '↘'} {trend.text}
        </p>
      )}
      {footer}
    </div>
  );
}
