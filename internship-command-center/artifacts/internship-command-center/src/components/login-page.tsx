import { useState } from 'react';
import { BriefcaseBusiness, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { setAuth, type AuthUser } from '@/lib/auth';

interface Props {
  onSuccess: (user: AuthUser) => void;
}

type Mode = 'login' | 'register';

export function LoginPage({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email, password };
      if (mode === 'register') body.name = name;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }

      setAuth(data.token, data.user);
      onSuccess(data.user);
    } catch {
      setError('Network error — check your connection');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <BriefcaseBusiness size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Internship Bot
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Sign in to your command center'
              : 'Create your personal command center'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="eyebrow mb-2 block">Your name</span>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Arjun Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field w-full"
                />
              </label>
            )}

            <label className="block">
              <span className="eyebrow mb-2 block">Email address</span>
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field w-full"
              />
            </label>

            <label className="block">
              <span className="eyebrow mb-2 block">Password</span>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field w-full pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full justify-center mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data stays private. Only you can see your applications and profile.
        </p>
      </div>
    </div>
  );
}
