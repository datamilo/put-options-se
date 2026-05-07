import { UpcomingEvent } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UpcomingEventCardProps {
  event: UpcomingEvent | null;
  stockName: string;
}

export const UpcomingEventCard = ({ event, stockName }: UpcomingEventCardProps) => {
  const { t } = useTranslation('pages');

  if (!event) {
    return null;
  }

  const isEarnings = event.is_earnings;
  const daysUntil = event.days_until_event;

  const isUrgent = daysUntil <= 7;
  const eventIcon = isEarnings ? <TrendingUp className="h-5 w-5" /> : <Gift className="h-5 w-5" />;
  const badgeVariant = isUrgent ? 'destructive' : 'default';

  return (
    <Card className={isUrgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-700' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{t('stockAnalysis.upcomingEvent.title')}</span>
          </div>
          <Badge variant={badgeVariant}>
            {t('stockAnalysis.upcomingEvent.days', { count: daysUntil })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('stockAnalysis.upcomingEvent.eventDate')}</p>
            <p className="text-lg font-semibold">{event.date}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('stockAnalysis.upcomingEvent.eventType')}</p>
            <div className="flex items-center gap-2">
              {eventIcon}
              <span className="font-semibold">{event.event_type}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('stockAnalysis.upcomingEvent.category')}</p>
            <p className="font-semibold">{event.event_category}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">{t('stockAnalysis.upcomingEvent.details')}</p>
          <p className="text-base">{event.details}</p>
        </div>
      </CardContent>
    </Card>
  );
};
