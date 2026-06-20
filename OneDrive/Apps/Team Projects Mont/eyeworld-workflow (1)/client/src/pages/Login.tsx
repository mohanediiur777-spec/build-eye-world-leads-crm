import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Eye, User } from "lucide-react";

// Visible team members only (Hamdi is hidden)
const VISIBLE_MEMBERS = [
  { name: "Hadeer", role: "Media Buyer",     initial: "H", color: "from-violet-500 to-purple-600" },
  { name: "Bakr",   role: "Designer",        initial: "B", color: "from-blue-500 to-indigo-600" },
  { name: "Asmaa",  role: "Content Creator", initial: "A", color: "from-emerald-500 to-teal-600" },
] as const;

export default function Login() {
  const [, navigate] = useLocation();
  const [pin, setPin]           = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Hidden director mode
  const [dKeyCount, setDKeyCount]   = useState(0);
  const [directorMode, setDirectorMode] = useState(false);
  const [directorName, setDirectorName] = useState("");

  // Detect 5 × "D" keypress to reveal director login
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (directorMode) return;
    if (e.key === "D" || e.key === "d") {
      setDKeyCount(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setDirectorMode(true);
          return 0;
        }
        return next;
      });
    } else {
      setDKeyCount(0);
    }
  }, [directorMode]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Authenticate against backend ─────────────────────────────────────────
  async function authenticate(body: { name?: string; pin?: string }) {
    const res = await fetch("/api/auth/pin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as any).error || "Invalid credentials");
    }
    return res.json() as Promise<{ success: boolean; user: { name: string; role: string } }>;
  }

  // ── Regular PIN login ─────────────────────────────────────────────────────
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    setIsLoading(true);
    try {
      const { user } = await authenticate({ name: selectedMember ?? undefined, pin });
      // Keep localStorage in sync for instant client-side reads
      localStorage.setItem("user", JSON.stringify({ name: user.name, role: user.role }));
      toast.success(`Welcome, ${user.name}!`);
      redirectByRole(user.role);
    } catch (err: any) {
      toast.error(err.message || "Invalid PIN. Please try again.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Director (Hamdi) name-only login ─────────────────────────────────────
  const handleDirectorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (directorName.trim() !== "Hamdi") {
      toast.error("Access denied.");
      return;
    }
    setIsLoading(true);
    try {
      const { user } = await authenticate({ name: "Hamdi" });
      localStorage.setItem("user", JSON.stringify({ name: user.name, role: user.role }));
      toast.success("Welcome, Hamdi.");
      redirectByRole(user.role);
    } catch (err: any) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  function redirectByRole(role: string) {
    if (role === "director") {
      navigate("/director");
    } else {
      navigate("/");
    }
    window.location.reload();
  }

  // ── Member card click ─────────────────────────────────────────────────────
  const handleMemberSelect = (name: string) => {
    setSelectedMember(name === selectedMember ? null : name);
    setPin("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EW-TC Campaign HQ</h1>
          <p className="text-slate-400 mt-2 text-sm">Select your profile to continue</p>
        </div>

        {/* Director hidden mode */}
        {directorMode ? (
          <Card className="border-slate-700 bg-slate-800/80 backdrop-blur shadow-2xl">
            <CardHeader className="border-b border-slate-700 pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Eye className="w-4 h-4 text-amber-400" />
                Director Access
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleDirectorLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="directorName" className="text-slate-300 text-sm">
                    Enter your name to continue
                  </Label>
                  <Input
                    id="directorName"
                    type="text"
                    placeholder="Your name"
                    value={directorName}
                    onChange={e => setDirectorName(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setDirectorMode(false); setDirectorName(""); }}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!directorName.trim() || isLoading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                  >
                    {isLoading ? "Authenticating…" : "Continue"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-700 bg-slate-800/80 backdrop-blur shadow-2xl">
            <CardContent className="p-6 space-y-6">
              {/* Team member avatars */}
              <div className="grid grid-cols-3 gap-3">
                {VISIBLE_MEMBERS.map(member => (
                  <button
                    key={member.name}
                    type="button"
                    onClick={() => handleMemberSelect(member.name)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedMember === member.name
                        ? "border-blue-500 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/20"
                        : "border-slate-700 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/60"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {member.initial}
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-semibold">{member.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{member.role}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* PIN entry */}
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-slate-300 text-sm font-medium">
                    {selectedMember ? `Enter ${selectedMember}'s PIN` : "Enter your PIN"}
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                    className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl font-bold tracking-widest placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/20 h-14"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={pin.length !== 4 || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold h-11 shadow-lg shadow-blue-500/20 transition-all duration-200"
                >
                  {isLoading ? "Authenticating…" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Secure access · EW-TC Team only
        </p>
      </div>
    </div>
  );
}
