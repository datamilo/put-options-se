import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StockPriceStats = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Options
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Stock Price Stats</h1>
                <p className="text-muted-foreground">Multi-period low support analysis and trading insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card className="overflow-hidden">
          <CardContent className="space-y-4">
            {/* Embedded Streamlit App */}
            <div className="w-full border rounded-lg overflow-hidden bg-background">
              <iframe
                src="https://stockpricestats-sjmi9xkxcxcuxtgxfmhov5.streamlit.app/?embedded=true"
                className="w-full border-0"
                style={{
                  minHeight: '800px',
                  height: 'calc(100vh - 300px)',
                }}
                title="Stock Price Stats Streamlit App"
                allow="same-origin"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border text-sm text-muted-foreground">
              <p className="mb-2">
                Note: The application opens in embedded mode. For best experience on mobile or if you encounter any issues, you can also
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://stockpricestats-sjmi9xkxcxcuxtgxfmhov5.streamlit.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Open in Full Window
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockPriceStats;
