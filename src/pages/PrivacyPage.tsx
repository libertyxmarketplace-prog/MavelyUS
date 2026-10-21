import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPage() {
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
            <span className="font-semibold text-sm">ERLC.US Privacy Policy</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-3 pb-8 border-b border-white/[0.08]">
          <div className="inline-flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <Shield className="size-3.5" />
            Effective Date: October 2026
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-white/60">
            This Privacy Policy explains how ERLC.US collects, uses, and safeguards information when you use the ERLC.US web dashboard.
          </p>
        </div>

        <div className="prose prose-invert mt-8 space-y-8 text-sm leading-relaxed text-white/80">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>
              When you use ERLC.US, we collect only the minimal data necessary to provide dashboard functionality:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li><strong className="text-white">Discord Account Information:</strong> Your Discord user ID, username, and guild memberships when you authenticate via Discord OAuth2 to access the dashboard.</li>
              <li><strong className="text-white">Server &amp; Configuration Data:</strong> Discord server IDs and the server details and settings you save in the web dashboard.</li>
              <li><strong className="text-white">ER:LC Server Credentials:</strong> Private server API keys and join keys that you provide to show live in-game statistics.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. How Information Is Used</h2>
            <p>The information collected is used exclusively for:</p>
            <ul className="list-disc pl-5 space-y-2 text-white/70">
              <li>Verifying your Discord server management permissions before allowing configuration changes.</li>
              <li>Communicating with the Emergency Response: Liberty County (ER:LC) API to display server metrics and live player rosters.</li>
              <li>Diagnosing technical faults and maintaining uptime of the dashboard.</li>
            </ul>
            <p className="font-medium text-white/90">We do not sell, rent, or trade your personal data or server configurations to any third party.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Security and Storage</h2>
            <p>
              Authentication tokens and API credentials stored in our database are isolated and protected. ER:LC keys are used only by our backend and are visible only to the authorized server owner.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Data Retention &amp; Deletion</h2>
            <p>
              Server configurations are retained as long as your server workspace remains registered with ERLC.US. You can request deletion of all associated data at any time by contacting our support server.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Third-Party Services</h2>
            <p>
              ERLC.US interacts with the Discord API and the Emergency Response: Liberty County (ER:LC) public server API. Your use of these platforms remains subject to the Discord Terms of Service and Roblox Community Guidelines.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50">
          <span>&copy; {new Date().getFullYear()} ERLC.US. All rights reserved.</span>
          <Link to="/terms" className="text-brand hover:underline">View Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
