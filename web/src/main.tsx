import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { DocsPage } from './pages/DocsPage';
import { PricingPage } from './pages/PricingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BannedPage } from './pages/BannedPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import ImportPage from './app/import/page';
import { ThemeProvider } from './components/library/theme-provider';
import './index.css';

import { useEffect } from 'react';
import { Button } from './components/ui/button';
import { Rocket, ShieldCheck, Coins, Activity, Zap, Check, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';

// Apply saved theme accent & performance mode on startup
try {
  const savedAccent = localStorage.getItem('erlcus_theme_accent');
  if (savedAccent) {
    const accents: Record<string, { oklch: string; color: string }> = {
      mint: { oklch: '0.75 0.14 160', color: '#2ecc71' },
      cyan: { oklch: '0.78 0.14 210', color: '#06b6d4' },
      purple: { oklch: '0.68 0.18 290', color: '#8b5cf6' },
      amber: { oklch: '0.75 0.16 75', color: '#f59e0b' },
    };
    const theme = accents[savedAccent] || accents.mint;
    document.documentElement.style.setProperty('--brand', `oklch(${theme.oklch})`);
    document.documentElement.style.setProperty('--theme-accent', theme.color);
    document.documentElement.style.setProperty('--embed-color', theme.color);
  }
  if (localStorage.getItem('erlcus_perf_mode') === 'true') {
    document.body.classList.add('reduce-motion');
  }
} catch {
  // Ignore localStorage access issues
}


export function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('auth_error');

  const handleDiscordLogin = () => {
    // Route via backend OAuth start endpoint to ensure valid CSRF state, correct redirect URI and security validation
    window.location.href = '/api/auth/discord/start?returnTo=%2Fdashboard';
  };


  return (
    <div className="min-h-screen relative flex flex-col justify-between text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
      {/* Background Photography (Autumn ER:LC bridge) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat scale-[1.02] transition-transform duration-1000"
        style={{ backgroundImage: "url('/login-bridge.webp')" }}
      />

      {/* Clean Contrast Overlays (No artificial glows or halos) */}
      <div className="fixed inset-0 z-0 bg-gradient-to-r from-black/90 via-black/75 to-black/85" />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

      {/* Top Left: Server Icon / Logo */}
      <header className="relative z-20 pt-8 px-6 sm:pt-10 sm:px-12 lg:px-16 flex items-center justify-between">
        <a href="/" className="inline-block transition-transform hover:scale-105 active:scale-95" title="Home">
          <img
            src="/mavely_logo.png"
            alt="Mavely"
            className="h-10 sm:h-12 w-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/mavely-mark.png';
            }}
          />
        </a>
      </header>

      {/* Main Two-Column Container */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 my-auto py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Far-Left Aligned Headline & Clean Features */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-7">
            <div className="space-y-3 text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Operations & Community <br className="hidden sm:inline" />
                Management for ER:LC
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed max-w-lg">
                The dedicated platform to run your server, track active staff patrols, and grow your Emergency Response: Liberty County community.
              </p>
            </div>

            {/* Feature Highlights Grid - Strictly Far Left, No Glows */}
            <div className="space-y-4 max-w-xl text-left w-full">
              {/* Feature 1 */}
              <div className="flex items-start text-left gap-3.5">
                <div className="shrink-0 mt-0.5 text-emerald-400 flex items-center justify-center">
                  <Rocket className="size-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Community Growth Engine</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-normal">
                    Promote your server, earn credits, and attract active ER:LC roleplayers.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start text-left gap-3.5">
                <div className="shrink-0 mt-0.5 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Patrol & Shift Operations</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-normal">
                    Log in-game shifts, verify Roblox ranks, and track active staff duty.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start text-left gap-3.5">
                <div className="shrink-0 mt-0.5 text-emerald-400 flex items-center justify-center">
                  <Coins className="size-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Daily Rewards & Leaderboards</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-normal">
                    Engage members with automated daily claims, streaks, and referral bonuses.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start text-left gap-3.5">
                <div className="shrink-0 mt-0.5 text-emerald-400 flex items-center justify-center">
                  <Activity className="size-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Live Uptime & Ticket Center</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 leading-normal">
                    24/7 server health monitoring, staff handbooks, and ticket automation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Sign-In Panel */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:ms-auto">
            <div className="p-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md space-y-5 text-left">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Sign in with Discord to manage your server and launch growth campaigns.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed space-y-1">
                  <div className="font-semibold text-white">
                    {error === 'login_expired' ? 'Session Refreshed' : 'Authentication Notice'}
                  </div>
                  <p className="text-zinc-300">
                    {error === 'login_expired'
                      ? 'Your previous login session timed out or was refreshed. Click "Continue with Discord" below to sign in.'
                      : `Status: ${error.replace(/_/g, ' ')}. Please try signing in again.`}
                  </p>
                </div>
              )}

              {/* Discord Action Button (Clean Discord color, no glowing drop-shadow) */}
              <Button
                type="button"
                onClick={handleDiscordLogin}
                className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
              >
                <svg className="size-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.894a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Continue with Discord</span>
              </Button>

              {/* 3 Trust Perks row */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-medium text-emerald-400/90 pt-1">
                <span className="flex items-center gap-1">
                  <Zap className="size-3 shrink-0" />
                  <span>Real-time sync</span>
                </span>
                <span className="flex items-center gap-1">
                  <Check className="size-3 shrink-0" />
                  <span>Staff & patrol logs</span>
                </span>
                <span className="flex items-center gap-1">
                  <Rocket className="size-3 shrink-0" />
                  <span>Growth engine</span>
                </span>
              </div>

              {/* Legal Terms & Privacy */}
              <p className="text-[11px] text-zinc-400 text-center leading-relaxed pt-1">
                By logging in, you accept the{' '}
                <a href="/terms" className="underline hover:text-white transition-colors">
                  Terms
                </a>{' '}
                and{' '}
                <a href="/privacy" className="underline hover:text-white transition-colors">
                  Privacy Policy
                </a>
                .
              </p>

              {/* Back Link */}
              <div className="text-center pt-1">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors font-medium"
                >
                  <ArrowLeft className="size-3" />
                  <span>Back to home</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-20 pb-8 px-6 sm:pb-10 sm:px-12 lg:px-16 flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-medium">
          Trusted infrastructure for Liberty County communities.
        </span>

        {/* Carousel Indicators */}
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-1 rounded-full bg-white transition-all shadow-sm" />
          <span className="size-1 rounded-full bg-white/40" />
          <span className="size-1 rounded-full bg-white/40" />
        </div>
      </footer>
    </div>
  );
}

function CallbackPage() {
  useEffect(() => {
    async function processAuth() {
      const hash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('access_token');

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');

      // 1. If Discord redirected with access_token (implicit grant)
      if (token) {
        try {
          const res = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            localStorage.setItem(
              'erlcus_user',
              JSON.stringify({
                id: user.id,
                username: user.username,
                globalName: user.global_name || user.username,
                avatar: user.avatar
              })
            );

            // Fetch user guilds
            try {
              const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (gRes.ok) {
                const guilds = await gRes.json();
                localStorage.setItem('erlcus_known_guilds', JSON.stringify(guilds));
              }
            } catch { }

            window.location.assign('/dashboard');
            return;
          }
        } catch { }
      }

      // 2. If bot installed callback
      if (guildId) {
        window.location.assign(`/dashboard/${guildId}?bot_installed=true`);
        return;
      }

      // 3. If authorization code was received, exchange it via backend
      if (code) {
        try {
          const res = await fetch(`/api/auth/discord/callback${window.location.search}`);
          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data?.user) {
              localStorage.setItem('mavely_user', JSON.stringify(data.user));
              window.location.assign('/dashboard');
              return;
            }
          }
        } catch { }
        window.location.assign('/login?auth_error=authentication_failed');
        return;
      }

      // 4. If neither token nor code was provided, check if an existing session is authenticated
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json().catch(() => null);
          if (meData?.user) {
            localStorage.setItem('mavely_user', JSON.stringify(meData.user));
            window.location.assign('/dashboard');
            return;
          }
        }
      } catch { }

      // No authentication credentials provided: return cleanly to login
      window.location.assign('/login');
      return;
    }

    processAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-3 text-xs text-zinc-400 font-mono">
      <div className="size-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
      <span>Connecting with Discord...</span>
    </div>
  );
}

import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center p-6 text-center text-white font-sans selection:bg-emerald-500/30">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-5">
            <AlertTriangle className="size-9 text-rose-400 mx-auto drop-shadow-md" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Dashboard Diagnostics</h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono bg-black/40 p-3 rounded-lg border border-white/5 break-words text-left">
                {this.state.error?.message || 'A render exception occurred.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Reload Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="border-white/10 hover:bg-white/5 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center gap-3 text-xs text-zinc-400 font-mono">
        <div className="size-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span>Authenticating with Discord...</span>
      </div>
    );
  }

  if (localStorage.getItem('erlcus_current_user_ban')) {
    return <Navigate to="/banned" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/discord" element={<CallbackPage />} />
              <Route path="/auth/discord/callback" element={<CallbackPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/api/auth/discord/callback" element={<CallbackPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/tos" element={<TermsPage />} />
              <Route path="/admin-portal" element={<AdminPortalPage />} />
              <Route path="/admin-portal/:tab" element={<AdminPortalPage />} />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:guildId"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:guildId/:tab"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <ImportPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const rootEl = document.getElementById('root')!;
const root = (rootEl as any)._reactRoot || createRoot(rootEl);
(rootEl as any)._reactRoot = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);