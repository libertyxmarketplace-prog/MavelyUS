import { useState } from 'react';
import { ArrowLeft, Bell, BellRing, Sparkles, Compass, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addLiveNotification } from '@/app/import/data';

interface ComingSoonTabProps {
  title: string;
  subtitle?: string;
  category?: string;
  features?: string[];
  onBackToOverview: () => void;
  addToast?: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

export function ComingSoonTab({
  title,
  subtitle = 'Live Emergency Response: Liberty County in-game patrol tracking, voice radio frequencies, and CAD server integration.',
  category = 'ER:LC Operations',
  features = [
    'Automated in-game patrol start/end logging and duty time tracking',
    'Live radio channel voice link and dispatcher status',
    'Server player activity and duty-time leaderboards'
  ],
  onBackToOverview,
  addToast
}: ComingSoonTabProps) {
  const [subscribed, setSubscribed] = useState(false);

  const handleNotifyToggle = () => {
    if (!subscribed) {
      setSubscribed(true);
      // Register in the live notification center
      addLiveNotification({
        title: `${title} - Release Alert Active`,
        description: `You will be notified right here when ${title} officially launches for this server.`,
        type: 'info'
      });
      addToast?.('success', 'Release Notification Set', `You will receive a notification in your notification center when ${title} launches.`);
    } else {
      setSubscribed(false);
      addToast?.('info', 'Notification Preference Cleared', `Launch notification for ${title} turned off.`);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto py-10 sm:py-20 px-4 animate-in fade-in-50 duration-300">
      {/* Top Navigation */}
      <div className="mb-8 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToOverview}
          className="h-8 border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white rounded-xl text-xs gap-1.5 transition-all"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Overview</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-8 relative">
        {/* Sleek Category Badge (NO green glow, neutral/indigo accent) */}
        <div className="flex items-center justify-center">
          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.04] text-slate-300 font-mono text-[11px] px-3.5 py-1 tracking-wider uppercase flex items-center gap-2 rounded-full shadow-sm"
          >
            <span className="size-2 rounded-full bg-indigo-400 animate-pulse" />
            <span>{category.toUpperCase()} · COMING SOON</span>
          </Badge>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3 max-w-xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            {subtitle}
          </p>
        </div>

        {/* What to expect on launch feature list */}
        {features.length > 0 && (
          <div className="max-w-md mx-auto text-left p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              What to expect on launch:
            </span>
            <div className="space-y-2.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Sparkles className="size-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleNotifyToggle}
            className={`h-11 px-6 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 ${
              subscribed
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-950 font-bold'
            }`}
          >
            {subscribed ? <CheckCircle className="size-4" /> : <Bell className="size-4" />}
            <span>{subscribed ? 'Notification Active' : 'Notify Me on Release'}</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onBackToOverview}
            className="h-11 px-6 rounded-xl text-xs font-medium border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 flex items-center gap-2"
          >
            <Compass className="size-4 text-slate-400" />
            <span>Explore Growth Directory</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ComingSoonTab;
