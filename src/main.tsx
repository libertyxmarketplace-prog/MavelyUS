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
import './index.css';

import { useEffect } from 'react';
import { Button } from './components/ui/button';

// Apply saved theme accent & performance mode on startup
try {
  const savedAccent = localStorage.getItem('mavely_theme_accent');
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
  if (localStorage.getItem('mavely_perf_mode') === 'true') {
    document.body.classList.add('reduce-motion');
  }
} catch {
  // Ignore localStorage access issues
}

const OAUTH_URL =
  'https://discord.com/oauth2/authorize?client_id=1552165138017165372&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds';

export function LoginPage() {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('auth_error');

  useEffect(() => {
    if (!error) {
      window.location.assign(OAUTH_URL);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#0e0e11] p-6 text-center space-y-4 shadow-2xl">
        <img src="/mavely-mark.png" alt="Mavely" className="size-10 rounded mx-auto" />
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white">Sign In with Discord</h2>
          <p className="text-xs text-white/50">
            {error ? `Notice: ${error.replace(/_/g, ' ')}` : 'Connecting your Discord account...'}
          </p>
        </div>
        <Button asChild className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-xs">
          <a href={OAUTH_URL}>
            {error ? 'Retry Discord Login' : 'Continue to Discord'}
          </a>
        </Button>
      </div>
    </div>
  );
}

function CallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.location.assign(`/api/auth/discord/callback${window.location.search}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center gap-3 text-xs text-white/50">
      <div className="size-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      <span>Completing Discord authentication...</span>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3 text-xs text-white/50">
        <div className="size-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        <span>Authenticating session...</span>
      </div>
    );
  }
  return user ? <>{children}</> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/discord/callback" element={<CallbackPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);