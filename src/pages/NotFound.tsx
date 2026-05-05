import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  usePageTitle('Page Not Found');
  const location = useLocation();
  const { session, loading } = useAuth();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "Session:", !!session,
      "Loading:", loading
    );
  }, [location.pathname, session, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">{t('notFoundPage.title')}</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="text-primary hover:text-primary/80 underline">
            {t('notFoundPage.returnHome')}
          </Link>
          <Link to="/auth" className="text-primary hover:text-primary/80 underline">
            {t('notFoundPage.goToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
