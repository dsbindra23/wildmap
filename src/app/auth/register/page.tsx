"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/app");
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "0.5rem",
    border: "1px solid var(--border)", backgroundColor: "var(--bg-2)",
    color: "var(--fg)", fontSize: 14, outline: "none",
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-base font-semibold mb-8 text-center" style={{ color: "var(--fg)" }}>
          WildMap
        </Link>
        <h1 className="text-xl font-semibold mb-6 text-center" style={{ color: "var(--fg)" }}>Create an account</h1>

        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg" style={{ backgroundColor: "var(--bg-3)", color: "var(--fg-2)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => { setGoogleLoading(true); signIn("google", { callbackUrl: "/app" }); }}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 text-sm py-2.5 rounded-lg border transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ borderColor: "var(--border)", color: "var(--fg)", backgroundColor: "var(--bg-2)" }}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign up with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--fg-3)" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>Password</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters" style={inputStyle} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium btn-primary disabled:opacity-50 transition-opacity hover:opacity-80">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: "var(--fg-3)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="underline underline-offset-2" style={{ color: "var(--fg-2)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
