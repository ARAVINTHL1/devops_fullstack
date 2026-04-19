import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/sonner";
import heroImage from "@/assets/hero-textiles.jpg";

const Signup = () => {
  const { signupBuyer } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await signupBuyer({ name, email, phone, password });
      toast.success("Buyer account created successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed.";
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

      <div className="w-full max-w-md relative z-10 text-slate-50">
        <div className="mb-8">
          <h1 className="text-xl font-extrabold font-display text-white">Buyer Signup</h1>
          <p className="text-xs text-slate-200 font-semibold">Create your wholesale buyer account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-100 font-semibold">Full Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required className="h-11 text-slate-900" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-100 font-semibold">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 text-slate-900" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-100 font-semibold">Phone</Label>
            <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required className="h-11 text-slate-900" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-100 font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              className="h-11 text-slate-900"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-sm text-slate-200 font-medium mt-5 text-center">
          Already have an account? <Link to="/login" className="text-white underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
