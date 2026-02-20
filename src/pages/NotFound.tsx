import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  usePageTitle('Page Not Found');
  const location = useLocation();
  const { session, loading } = useAuth();

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
        <p className="text-xl text-muted-foreground mb-4">Page not found</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="text-primary hover:text-primary/80 underline">
            Return to Home
          </Link>
          <Link to="/auth" className="text-primary hover:text-primary/80 underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
