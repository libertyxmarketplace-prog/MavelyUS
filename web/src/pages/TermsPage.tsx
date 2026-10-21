import { Link } from 'react-router-dom';
import { ArrowLeft, FileCheck } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <img src="/erlcus-mark.png" alt="ERLC.US" className="size-6 rounded" />
            <span className="font-semibold text-sm">ERLC.US Terms of Service</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-3 pb-8 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <FileCheck className="size-3.5" />
            Effective Date: October 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-white/60">
            Please review these Terms of Service before inviting ERLC.US to your Discord server or using our dashboard.
          </p>
        </div>

        <div className="prose prose-invert mt-8 space-y-8 text-sm leading-relaxed text-white/80">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By adding ERLC.US to your Discord server, connecting via Discord OAuth2, or utilizing the web dashboard, you agree to comply with and be bound by these Terms of Service, as well as Discord&apos;s Terms of Service and Community Guidelines.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Community Growth &amp; Join-for-Join Integrity</h2>
            <p>
              ERLC.US provides verified Discord community discovery and join-for-join progression. To maintain network integrity:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li><strong>No Automated Bot Accounts:</strong> All joining accounts must be genuine Discord users. Automated user-bots, headless accounts, or scripted join farms are strictly prohibited and subject to automated platform bans.</li>
              <li><strong>Account Authenticity:</strong> Accounts must be at least 7 days old and feature a non-default profile avatar to claim credit bounties.</li>
              <li><strong>Permanent Invite Links:</strong> Community promoters must supply permanent, non-expiring Discord invite links without artificial member limits.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. 72-Hour Credit Retention Guarantee</h2>
            <p>
              When a user claims a growth bounty by joining a partnered community:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li>Credits awarded are held under an active <strong>72-Hour Retention Lock</strong>.</li>
              <li>If an account departs or is kicked from the target Discord server prior to 72 hours, the awarded credits are automatically revoked.</li>
              <li>Repeated churn-and-leave violations will trigger account restrictions from the global directory.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Zero-Fee Treasury Transfers &amp; Campaign Funding</h2>
            <p>
              All peer-to-peer credit transfers and campaign treasury deposits are executed with 0% platform commission fees. Credits hold no monetary fiat cash value and cannot be exchanged for currency.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Anti-Raid &amp; Server Security Protection</h2>
            <p>
              ERLC.US checks joins made through the directory to prevent raid cascades and malicious mass-joins. Community administrators reserve the right to configure custom verification roles and account age thresholds.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Availability &amp; Disclaimer</h2>
            <p>
              ERLC.US is provided &quot;as is&quot; without warranties of any kind. While we aim for continuous 24/7 uptime, service may occasionally be interrupted for scheduled maintenance or Discord API outages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Account Termination</h2>
            <p>
              We reserve the right to suspend or ban any server directory listing, or user account that violates these Terms or attempts unauthorized access to system resources.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
          <span>&copy; {new Date().getFullYear()} ERLC.US. All rights reserved.</span>
          <Link to="/privacy" className="text-brand hover:underline">View Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
