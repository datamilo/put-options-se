import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the URL automatically if detectSessionInUrl is enabled (default).
    // We just check for a session and redirect accordingly.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      navigate(session ? "/" : "/auth", { replace: true });
    }, 200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <div className="p-6">Finishing sign in…</div>;
};

export default AuthCallback;
