import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const AuthCallback = () => {
  usePageTitle('Authentication');
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the URL automatically if detectSessionInUrl is enabled (default).
    // We just check for a session and redirect accordingly.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? "/" : "/auth", { replace: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="p-6">
      <p>{t('authCallback.signingIn')}</p>
      <p className="mt-2">
        {t('authCallback.notRedirected')} <Link to="/auth" className="underline">{t('authCallback.goToLogin')}</Link>.
      </p>
    </div>
  );
};

export default AuthCallback;
