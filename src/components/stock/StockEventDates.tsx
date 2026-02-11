import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertCircle } from 'lucide-react';
import { useStockEventsData } from '@/hooks/useStockEventsData';

interface StockEventDatesProps {
  stockName: string;
}

export const StockEventDates: React.FC<StockEventDatesProps> = ({ stockName }) => {
  const { getNextFinancialReportDate, getNextDividendDate } = useStockEventsData();

  // Get next actual event dates from historical events data
  const nextFinancialReportDate = getNextFinancialReportDate(stockName)
    ? new Date(getNextFinancialReportDate(stockName)!)
    : null;

  const nextDividendDate = getNextDividendDate(stockName)
    ? new Date(getNextDividendDate(stockName)!)
    : null;

  // If no event dates, don't render
  if (!nextFinancialReportDate && !nextDividendDate) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Upcoming Events</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Report / Earnings */}
            {nextFinancialReportDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Financial Report (Earnings)</p>
                </div>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 ml-6">
                  {nextFinancialReportDate.toLocaleDateString('sv-SE')}
                </p>
              </div>
            )}

            {/* X-Day / Dividend */}
            {nextDividendDate && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dividend Date</p>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 ml-6">
                  {nextDividendDate.toLocaleDateString('sv-SE')}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
