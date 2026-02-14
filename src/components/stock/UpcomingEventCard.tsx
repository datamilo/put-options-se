import { UpcomingEvent } from '@/types/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Gift } from 'lucide-react';
import { formatNordicNumber } from '@/utils/numberFormatting';

interface UpcomingEventCardProps {
  event: UpcomingEvent | null;
  stockName: string;
}

export const UpcomingEventCard = ({ event, stockName }: UpcomingEventCardProps) => {
  if (!event) {
    return null; // Don't display card if no event found
  }

  const isEarnings = event.is_earnings;
  const daysUntil = event.days_until_event;

  // Determine color and icon based on event type
  const isUrgent = daysUntil <= 7;
  const eventIcon = isEarnings ? <TrendingUp className="h-5 w-5" /> : <Gift className="h-5 w-5" />;
  const badgeVariant = isUrgent ? 'destructive' : 'default';

  return (
    <Card className={isUrgent ? 'border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-700' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Event</span>
          </div>
          <Badge variant={badgeVariant}>
            {daysUntil} day{daysUntil === 1 ? '' : 's'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Event Date</p>
            <p className="text-lg font-semibold">{event.date}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Event Type</p>
            <div className="flex items-center gap-2">
              {eventIcon}
              <span className="font-semibold">{event.event_type}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-semibold">{event.event_category}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">Details</p>
          <p className="text-base">{event.details}</p>
        </div>
      </CardContent>
    </Card>
  );
};
