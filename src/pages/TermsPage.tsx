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
            <img src="/civlink-mark.png" alt="CivLink" className="size-6 object-contain" />
            <span className="font-semibold text-sm">CivLink Terms of Service</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-3 pb-8 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
            <FileCheck className="size-3.5" />
            Effective Date: October 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-white/60">
            Please review these Terms of Service before inviting CivLink to your Discord server or using our dashboard.
          </p>
        </div>

        <div className="prose prose-invert mt-8 space-y-8 text-sm leading-relaxed text-white/80">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By adding CivLink to your Discord server or signing in to the web dashboard, you agree to comply with and be bound by these Terms of Service, as well as the Discord Terms of Service and Roblox Developer Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Acceptable Use</h2>
            <p>You agree not to use CivLink to:</p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li>Violate Discord&apos;s Community Guidelines or Developer Terms of Service.</li>
              <li>Spam, harass, raid, or disrupt any Discord server or in-game Emergency Response: Liberty County server.</li>
              <li>Attempt to reverse-engineer, exploit, or bypass bot permission boundaries or database security.</li>
              <li>Input forged, stolen, or unauthorized bot tokens or ER:LC API keys.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Bot Instance Responsibility</h2>
            <p>
              When hosting a dedicated customer bot instance through CivLink, you are responsible for maintaining your bot application in the Discord Developer Portal, ensuring appropriate gateway intents (Server Members Intent, Message Content Intent) are enabled, and complying with Discord rate limits.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Availability &amp; Disclaimer</h2>
            <p>
              CivLink is provided &quot;as is&quot; without warranties of any kind. While our automated watchdog and reconnect systems strive for continuous 24/7 uptime, service may occasionally be interrupted for scheduled maintenance or Discord API outages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Termination</h2>
            <p>
              We reserve the right to suspend or ban any bot instance or user that violates these Terms, engages in malicious abuse, or attempts unauthorized access to system resources.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
          <span>&copy; {new Date().getFullYear()} CivLink. All rights reserved.</span>
          <Link to="/privacy" className="text-cyan-400 hover:underline">View Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
