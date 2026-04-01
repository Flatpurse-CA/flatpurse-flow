import { useState, useEffect } from "react";
import manaaLogoDark from "@/assets/manaa-logo-darkmode.svg";
import manaaLogoLight from "@/assets/manaa-logo-lightmode.svg";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { useTheme } from "next-themes";
import authHero1 from "@/assets/auth-hero-1.jpg";
import authHero2 from "@/assets/auth-hero-2.jpg";
import authHero3 from "@/assets/auth-hero-3.jpg";

const heroSlides = [
  { img: authHero1, headline: "Track Every Sale, Grow Every Day", sub: "From market stalls to storefronts — manage your money with ease." },
  { img: authHero2, headline: "Freelance Smarter, Not Harder", sub: "Invoices, expenses and reports — all in one place for your hustle." },
  { img: authHero3, headline: "Run Your Shop Like a Pro", sub: "Barbers, stylists, artisans — take control of your business finances." },
];

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isSignUp, setIsSignUp] = useState(!!refCode);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signIn(form.get("email") as string, form.get("password") as string);
    } catch (err: any) {
      toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signUp(
        form.get("email") as string,
        form.get("password") as string,
        form.get("fullName") as string,
      );
      // Store referral code in localStorage so we can link it after email verification
      if (refCode) {
        localStorage.setItem("manaa_ref_code", refCode);
      }
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
    } catch (err: any) {
      toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await resetPassword(form.get("email") as string);
      toast({ title: "Reset email sent", description: "Check your inbox for a password reset link." });
      setShowForgot(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Google sign in failed", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      {/* Left panel — hero images */}
      <div className="hidden lg:flex lg:w-1/2 relative rounded-2xl overflow-hidden m-2">
        {/* Slideshow images */}
        {heroSlides.map((slide, i) => (
          <img
            key={i}
            src={slide.img}
            alt={slide.headline}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: activeSlide === i ? 1 : 0 }}
          />
        ))}

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-20" />

        <div className="relative z-30 flex flex-col justify-end p-10 pb-12">
          <h2 className="text-3xl font-bold leading-tight mb-3 text-white">
            {heroSlides[activeSlide].headline}
          </h2>
          <p className="text-white/70 text-sm max-w-md">
            {heroSlides[activeSlide].sub}
          </p>
          <div className="flex gap-2 mt-6">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className="w-8 h-1 rounded-full transition-colors"
                style={{ backgroundColor: activeSlide === i ? 'hsl(75, 80%, 50%)' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col p-6 md:p-12">
        {/* Top bar with logo and theme toggle */}
        <div className="flex items-center justify-between mb-8">
          <img src={manaaLogoLight} alt="Manaa" className="h-8 block dark:hidden" />
          <img src={manaaLogoDark} alt="Manaa" className="h-8 hidden dark:block" />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </button>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {showForgot ? (
              <>
                <h1 className="text-2xl font-bold mb-1">Reset password</h1>
                <p className="text-sm text-muted-foreground mb-8">Enter your email and we'll send a reset link</p>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm text-muted-foreground">Your email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input id="forgot-email" name="email" type="email" required placeholder="name@example.com" className="h-12 rounded-xl pl-10" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl font-medium border-0" style={{ backgroundColor: 'hsl(var(--accent-green))', color: 'hsl(var(--accent-green-foreground))' }} disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <button type="button" className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowForgot(false)}>
                    Back to Sign In
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-1">
                  {isSignUp ? "Create an account" : "Welcome back"}
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  {isSignUp
                    ? "Access your finances anytime, anywhere — and keep everything in one place."
                    : "Sign in to continue to your dashboard"}
                </p>

                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm text-muted-foreground">Full name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input id="fullName" name="fullName" required placeholder="John Doe" className="h-12 rounded-xl pl-10" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">Your email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input id="email" name="email" type="email" required placeholder="name@example.com" className="h-12 rounded-xl pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                      {!isSignUp && (
                        <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors" onClick={() => setShowForgot(true)}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={isSignUp ? 6 : undefined}
                        placeholder="••••••••"
                        className="h-12 rounded-xl pl-10 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl font-medium border-0"
                    style={{ backgroundColor: 'hsl(var(--accent-green))', color: 'hsl(var(--accent-green-foreground))' }}
                    disabled={loading}
                  >
                    {loading
                      ? (isSignUp ? "Creating account..." : "Signing in...")
                      : (isSignUp ? "Get Started" : "Sign in")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2.5 font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <GoogleIcon />
                  Google
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-8">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
