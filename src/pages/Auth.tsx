import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

const Auth = () => {
  usePageTitle('Login');
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const from = useMemo(() => (location.state as any)?.from?.pathname || "/", [location.state]);

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const { error } = await signIn(email, password);
    if (error) {
      console.error("Supabase sign-in error:", error);
      const message = error.message === "Failed to fetch"
        ? t('authPage.networkError')
        : error.message ?? t('auth.failedSignIn');
      setError(message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const { error } = await signUp(email, password);
    if (error) {
      console.error("Supabase sign-up error:", error);
      const message = error.message === "Failed to fetch"
        ? t('authPage.networkError')
        : error.message ?? t('auth.failedSignUp');
      setError(message);
    } else {
      setInfo(t('authPage.confirmEmail'));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center">
        {/* Value proposition */}
        <div className="flex-1 max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('authPage.appTitle')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('authPage.appSubtitle')}
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <span>{t('authPage.feature1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <span>{t('authPage.feature2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <span>{t('authPage.feature3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <span>{t('authPage.feature4')}</span>
            </li>
          </ul>
        </div>

        {/* Sign-in card */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('authPage.cardTitle')}</CardTitle>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">{t('authPage.tabSignIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('authPage.tabSignUp')}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('authPage.emailLabel')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('authPage.emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('authPage.passwordLabel')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t('authPage.passwordPlaceholder')}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">{error}</p>
                )}
                <Button type="submit" className="w-full">{t('authPage.signInButton')}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email2">{t('authPage.emailLabel')}</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={t('authPage.emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">{t('authPage.passwordLabel')}</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={t('authPage.passwordCreatePlaceholder')}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">{error}</p>
                )}
                {info && (
                  <p className="text-sm text-success" role="status">{info}</p>
                )}
                <Button type="submit" className="w-full">{t('authPage.createAccountButton')}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </main>
  );
};

export default Auth;
