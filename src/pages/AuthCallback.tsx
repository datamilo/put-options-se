import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
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
      <p>Finishing sign in…</p>
      <p className="mt-2">
        If you are not redirected, <Link to="/auth" className="underline">go to login</Link>.
      </p>
    </div>
  );
};

export default AuthCallback;
