import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/auth/AuthProvider';

export const AnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();
  const { user } = useAuth();

  // Track page views on route changes
  useEffect(() => {
    if (user) {
      trackPageView(location.pathname, document.title, {
        referrer: document.referrer,
        search_params: Object.fromEntries(new URLSearchParams(location.search)),
      });
    }
  }, [location, user, trackPageView]);

  return <>{children}</>;
};
