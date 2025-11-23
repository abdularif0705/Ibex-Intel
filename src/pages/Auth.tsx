import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const mode = searchParams.get("mode") || "login";
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check onboarding status
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarding_completed')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (!prefs?.onboarding_completed) {
          navigate("/onboarding");
        } else {
          navigate("/");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email only
      const emailSchema = z.string().email("Invalid email address").max(255);
      const validation = emailSchema.safeParse(email);
      
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Password reset link sent! Check your email.",
        });
        setIsResetMode(false);
        setEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!isLogin && password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify captcha for signup
      if (!isLogin && !captchaToken) {
        toast({
          title: "Verification Required",
          description: "Please complete the captcha verification",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Check if onboarding is completed
          const { data: prefs } = await supabase
            .from('user_preferences')
            .select('onboarding_completed')
            .eq('user_id', data.user.id)
            .maybeSingle();

          toast({
            title: "Success",
            description: "Logged in successfully",
          });

          // Check if onboarding is completed
          if (!prefs?.onboarding_completed) {
            navigate("/onboarding");
          } else {
            navigate("/");
          }
        }
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            captchaToken,
          },
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
          // Reset captcha on error
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
        } else {
          toast({
            title: "Success",
            description: "Account created! Let's get you set up.",
          });
          navigate("/onboarding");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-gradient-subtle">
      <Card className="w-full max-w-md p-8 border-border bg-card">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-block text-2xl font-bold">
            AltData Intelligence
          </Link>
          <h1 className="mb-2 text-2xl font-bold">
            {isResetMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isResetMode
              ? "Enter your email to receive a password reset link"
              : isLogin
              ? "Log in to access your alternative data dashboard"
              : "Start your institutional-grade data access"}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={isResetMode ? handlePasswordReset : handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@institution.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {!isResetMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-xs text-primary hover:underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          {!isLogin && !isResetMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex justify-center">
                <HCaptcha
                  ref={captchaRef}
                  sitekey="3e043eac-8ca0-4daa-b39e-54dcc0243706"
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" size="lg" variant="premium" disabled={loading || (!isLogin && !isResetMode && !captchaToken)}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isResetMode ? "Sending reset link..." : isLogin ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              <>{isResetMode ? "Send Reset Link" : isLogin ? "Log In" : "Create Account"}</>
            )}
          </Button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isResetMode ? (
            <>
              Remember your password?{" "}
              <button
                onClick={() => {
                  setIsResetMode(false);
                  setEmail("");
                }}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Back to Log In
              </button>
            </>
          ) : (
            <>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
                disabled={loading}
              >
                {isLogin ? "Create Account" : "Log In"}
              </button>
            </>
          )}
        </div>

        {!isResetMode && (
          <>
            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Google Sign-In */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2">Continue with Google</span>
            </Button>
          </>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Enterprise Contact */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Enterprise solutions?{" "}
            <a href="mailto:enterprise@altdata.com" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
