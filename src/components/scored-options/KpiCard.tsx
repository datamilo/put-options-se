import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InfoIconTooltip } from '@/components/ui/info-icon-tooltip';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number | null;
  subValue?: string; // Smaller text below main value
  icon: LucideIcon;
  iconColor: string;
  tooltipTitle: string;
  tooltipContent: string;
  colorClass?: 'text-blue-600' | 'text-green-600' | 'text-red-600' | 'text-orange-600'; // Color for icon
  valueClassName?: string; // CSS class for conditional value styling (e.g., "text-green-600")
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor,
  tooltipTitle,
  tooltipContent,
  colorClass = 'text-blue-600',
  valueClassName,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <InfoIconTooltip title={tooltipTitle} content={tooltipContent} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${valueClassName || ''}`}>
              {value !== null && value !== undefined ? value : '-'}
            </p>
            {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
          </div>
          <Icon className={`h-8 w-8 ${colorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
};
