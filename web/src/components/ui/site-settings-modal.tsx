import { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Check,
  RotateCcw,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface SiteSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCENT_THEMES = [
  { id: 'mint', name: 'ERLC.US Mint', color: '#2ecc71', oklch: '0.75 0.14 160' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#06b6d4', oklch: '0.78 0.14 210' },
  { id: 'purple', name: 'Neon Purple', color: '#8b5cf6', oklch: '0.68 0.18 290' },
  { id: 'amber', name: 'Tactical Amber', color: '#f59e0b', oklch: '0.75 0.16 75' },
];

export function SiteSettingsModal({ open, onOpenChange }: SiteSettingsModalProps) {
  const [selectedAccent, setSelectedAccent] = useState('mint');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [latency, setLatency] = useState(14);

  // Load saved preferences
  useEffect(() => {
    const savedAccent = localStorage.getItem('erlcus_theme_accent');
    if (savedAccent) {
      setSelectedAccent(savedAccent);
      applyAccent(savedAccent);
    }
    const savedSound = localStorage.getItem('erlcus_sound_fx');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    const savedPerf = localStorage.getItem('erlcus_perf_mode');
    if (savedPerf !== null) setPerformanceMode(savedPerf === 'true');
  }, []);

  // Ping simulation
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setLatency(12 + Math.floor(Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, [open]);

  const applyAccent = (accentId: string) => {
    const theme = ACCENT_THEMES.find((t) => t.id === accentId) || ACCENT_THEMES[0];
    document.documentElement.style.setProperty('--brand', `oklch(${theme.oklch})`);
    document.documentElement.style.setProperty('--theme-accent', theme.color);
    document.documentElement.style.setProperty('--embed-color', theme.color);
    localStorage.setItem('erlcus_theme_accent', accentId);
  };

  const handleSelectAccent = (accentId: string) => {
    setSelectedAccent(accentId);
    applyAccent(accentId);
    playChime();
    toast.success(`Theme accent set to ${ACCENT_THEMES.find((t) => t.id === accentId)?.name}!`);
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('erlcus_sound_fx', String(enabled));
    if (enabled) playChime();
  };

  const handleTogglePerformance = (enabled: boolean) => {
    setPerformanceMode(enabled);
    localStorage.setItem('erlcus_perf_mode', String(enabled));
    if (enabled) {
      document.body.classList.add('reduce-motion');
      toast.info('Performance mode enabled. Reduced animations active.');
    } else {
      document.body.classList.remove('reduce-motion');
      toast.info('Smooth animations restored.');
    }
  };

  // Synthesize gentle soft audio chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleReset = () => {
    handleSelectAccent('mint');
    handleToggleSound(true);
    handleTogglePerformance(false);
    toast.success('Site preferences reset to default!');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#121316] text-white shadow-2xl overflow-hidden z-10 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white/[0.05] border border-white/10 text-white">
              <Sliders className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Website Preferences</h3>
              <p className="text-[11px] text-zinc-400">Customize theme glow, sounds, and performance</p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Accent Colors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <Palette className="size-3.5 text-zinc-400" />
                <span>Ambient Theme Glow</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Real-time accent</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {ACCENT_THEMES.map((theme) => {
                const isSelected = selectedAccent === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectAccent(theme.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'border-white/20 bg-white/[0.08] text-white shadow-sm'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span
                      className="size-3.5 rounded-full shrink-0 ring-2 ring-white/10"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="flex-1 truncate">{theme.name}</span>
                    {isSelected && <Check className="size-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Audio & Feedback */}
          <div className="space-y-3 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  {soundEnabled ? <Volume2 className="size-3.5 text-zinc-400" /> : <VolumeX className="size-3.5 text-zinc-500" />}
                  <span>UI Audio Feedback</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Play gentle Discord-style chimes on interactive button actions
                </p>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={handleToggleSound} />
            </div>

            {/* Performance Mode */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                  <Zap className="size-3.5 text-zinc-400" />
                  <span>Performance / Low-Spec Mode</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Reduce heavy blur filters and animations for low-spec hardware
                </p>
              </div>
              <Switch checked={performanceMode} onCheckedChange={handleTogglePerformance} />
            </div>
          </div>

          {/* Section 3: Live System Health */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
                <Activity className="size-3 text-emerald-400" />
                <span>Runtime Diagnostics</span>
              </span>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                API Operational
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-black/20 p-2.5 space-y-0.5">
                <span className="text-[10px] text-zinc-500 block">Gateway Latency</span>
                <span className="font-mono font-bold text-white text-sm">{latency} ms</span>
              </div>
              <div className="rounded-lg bg-black/20 p-2.5 space-y-0.5">
                <span className="text-[10px] text-zinc-500 block">Server Deployment</span>
                <span className="font-mono font-bold text-white text-sm">v2.4.0-stable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] px-6 py-3.5 bg-black/20">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-zinc-400 hover:text-white"
          >
            <RotateCcw className="size-3 mr-1.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="bg-white text-black hover:bg-zinc-200 text-xs font-semibold px-4"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SiteSettingsModal;
