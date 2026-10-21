import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import PricingComponent from '@/components/ui/interactive-pricing-component';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex font-sans selection:bg-brand/30 selection:text-white relative overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 pl-14 sm:pl-16 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-14 border-b border-white/[0.06] bg-[#090a0f]/80 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-zinc-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="size-3 text-zinc-600" />
            <span className="text-xs font-semibold text-white">Pricing</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#2ecc71] transition-colors font-medium px-2 py-1"
            >
              <span className="text-[#2ecc71] font-bold">+</span>
              <span>Sign in with Discord</span>
            </Link>

            <a
              href="/docs"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            >
              <span>Help & Support</span>
              <ExternalLink className="size-3 text-zinc-500" />
            </a>
          </div>
        </header>

        {/* Clean Standard Pricing Arena */}
        <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          <PricingComponent showComparison={true} />
        </main>

        {/* Footer */}
        <footer className="mt-auto py-8 border-t border-white/[0.06] bg-[#090a0f] text-xs text-white/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/erlcus-mark.png" alt="ERLC.US" className="size-4 object-contain" />
              <span className="font-medium text-white/70">ERLC.US</span>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="/docs" className="hover:text-white transition-colors">Discord Server</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default PricingPage;
