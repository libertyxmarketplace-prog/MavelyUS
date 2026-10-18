import { KeyRound, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CredentialsTab() {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-4 animate-in fade-in-50 duration-200">
      <KeyRound className="size-8 text-zinc-400 mx-auto" />
      <div className="space-y-2">
        <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-zinc-400 font-mono text-[10px] inline-flex items-center gap-1">
          <Clock className="size-3" />
          <span>COMING SOON</span>
        </Badge>
        <h3 className="text-xl font-bold text-white tracking-tight">
          Developer Credentials & API
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
          Custom Discord bot token provisioning and REST API keys will be available in the upcoming release.
        </p>
      </div>
    </div>
  );
}

export default CredentialsTab;
