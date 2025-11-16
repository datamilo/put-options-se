import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecoveryMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'success' | 'danger';
}

export const RecoveryMetricCard: React.FC<RecoveryMetricCardProps> = ({
  title,
  value,
  description,
  variant = 'default'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20';
      case 'danger':
        return 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20';
      default:
        return '';
    }
  };

  return (
    <Card className={getVariantClasses()}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium opacity-90">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-sm opacity-70 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
