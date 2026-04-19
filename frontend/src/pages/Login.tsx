import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import heroImage from "@/assets/hero-textiles.jpg";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-8 overflow-hidden">
        <img
          src={heroImage}
          alt="Textile warehouse"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-[1px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,22,48,0.84)_0%,rgba(18,36,68,0.74)_48%,rgba(31,43,66,0.64)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_76%,rgba(224,177,83,0.24)_0%,rgba(224,177,83,0.08)_22%,transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_28%,rgba(5,14,31,0.54)_100%)]" />

        <div className="w-full max-w-md relative z-10">
          <Card className="shadow-2xl border-slate-200/20 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-6">
              <div className="text-center">
                <h1 className="text-xl font-extrabold font-display text-slate-900">MS Garments Hub</h1>
                <p className="text-xs text-slate-600 font-semibold">B2B Textile Wholesale</p>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-extrabold font-display text-slate-900">Welcome back</CardTitle>
                <CardDescription className="text-slate-600 font-medium">Sign in to your wholesale account</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 font-semibold text-slate-900 placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pr-12 font-semibold text-slate-900 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-sm text-slate-600 font-medium text-center mt-6">
                Buyer account not created yet? <Link to="/signup" className="text-slate-900 font-semibold underline hover:text-slate-700">Sign up</Link>
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-200 font-medium text-center mt-8">
            📍 Erodeee, Tamil Nadu • MS Garments Hub 2026
          </p>
        </div>
    </div>
  );
};

export default Login;
