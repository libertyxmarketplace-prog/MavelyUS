import { useState } from 'react';
import { Edit3, ListFilter, Hash, Volume2, Folder, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Select, {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/indevui-select';
import type { DiscordChannelOption, DiscordRoleOption } from '@/types';

interface ChannelSelectProps {
  channels?: DiscordChannelOption[];
  value?: string;
  onChange: (channelId: string) => void;
  placeholder?: string;
  allowedTypes?: number[]; // 0: text, 2: voice, 4: category, 5: announcement
  className?: string;
}

export function ChannelSelect({
  channels = [],
  value = '',
  onChange,
  placeholder = 'Select a server channel...',
  allowedTypes,
  className = ''
}: ChannelSelectProps) {
  const [manualMode, setManualMode] = useState(false);

  // Filter actual server channels by allowed types
  const filteredChannels = allowedTypes
    ? channels.filter((c) => allowedTypes.includes(Number(c.type)))
    : channels;

  const hasChannels = filteredChannels.length > 0;
  const textChannels = filteredChannels.filter((c) => Number(c.type) === 0 || Number(c.type) === 5);
  const voiceChannels = filteredChannels.filter((c) => Number(c.type) === 2);
  const categoryChannels = filteredChannels.filter((c) => Number(c.type) === 4);

  // If in manual mode or no channels synced yet
  if (manualMode || !hasChannels) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-1.5">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hasChannels ? "Enter channel name or ID..." : "Channel name or ID (auto-syncs when bot is in server)..."}
            className="text-xs bg-white/[0.04] border-white/10 text-white font-mono"
          />
          {hasChannels && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setManualMode(false)}
              className="text-[11px] h-9 px-2.5 border-white/10 shrink-0 text-white/70 hover:text-white"
              title="Pick from server channels"
            >
              <ListFilter className="size-3.5 mr-1" />
              List
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex-1 min-w-0">
        <Select value={value || ''} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-white text-xs h-9">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#12141c] border-white/10 text-white shadow-2xl max-h-72">
            {textChannels.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1.5">
                  <Hash className="size-3 text-[#2ecc71]" /> Text &amp; Announcements
                </SelectLabel>
                {textChannels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs focus:bg-white/[0.08] focus:text-white cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#2ecc71]">#</span>
                      <span className="font-medium">{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {voiceChannels.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Volume2 className="size-3 text-cyan-400" /> Voice &amp; Radio Channels
                </SelectLabel>
                {voiceChannels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs focus:bg-white/[0.08] focus:text-white cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="text-cyan-400">🔊</span>
                      <span className="font-medium">{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}

            {categoryChannels.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Folder className="size-3 text-amber-400" /> Channel Categories
                </SelectLabel>
                {categoryChannels.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs focus:bg-white/[0.08] focus:text-white cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-400">📁</span>
                      <span className="font-medium">{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setManualMode(true)}
        className="text-[11px] h-9 px-2 text-zinc-400 hover:text-white shrink-0"
        title="Custom channel name / ID input"
      >
        <Edit3 className="size-3.5" />
      </Button>
    </div>
  );
}

interface RoleSelectProps {
  roles?: DiscordRoleOption[];
  value?: string;
  onChange: (roleId: string) => void;
  placeholder?: string;
  className?: string;
}

export function RoleSelect({
  roles = [],
  value = '',
  onChange,
  placeholder = 'Select a server role...',
  className = ''
}: RoleSelectProps) {
  const [manualMode, setManualMode] = useState(false);
  const hasRoles = roles.length > 0;

  if (manualMode || !hasRoles) {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-1.5">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hasRoles ? "Enter role name or ID..." : "Role name or ID (auto-syncs when bot is in server)..."}
            className="text-xs bg-white/[0.04] border-white/10 text-white font-mono"
          />
          {hasRoles && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setManualMode(false)}
              className="text-[11px] h-9 px-2.5 border-white/10 shrink-0 text-white/70 hover:text-white"
              title="Pick from server roles"
            >
              <ListFilter className="size-3.5 mr-1" />
              List
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex-1 min-w-0">
        <Select value={value || ''} onValueChange={(val) => onChange(val)}>
          <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-white text-xs h-9">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#12141c] border-white/10 text-white shadow-2xl max-h-72">
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1.5">
                <Shield className="size-3 text-[#5865f2]" /> Server Roles
              </SelectLabel>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs focus:bg-white/[0.08] focus:text-white cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full inline-block shrink-0"
                      style={{
                        backgroundColor:
                          typeof r.color === 'number' && r.color > 0
                            ? `#${r.color.toString(16).padStart(6, '0')}`
                            : '#5865f2'
                      }}
                    />
                    <span className="text-[#5865f2]">@</span>
                    <span className="font-medium">{r.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setManualMode(true)}
        className="text-[11px] h-9 px-2 text-zinc-400 hover:text-white shrink-0"
        title="Custom role name / ID input"
      >
        <Edit3 className="size-3.5" />
      </Button>
    </div>
  );
}

export interface MultiRoleSelectProps {
  roles?: DiscordRoleOption[];
  values?: string[];
  onChange: (roleIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiRoleSelect({
  roles = [],
  values = [],
  onChange,
  placeholder = 'Add awarded roles...',
  className = ''
}: MultiRoleSelectProps) {
  const [manualInput, setManualInput] = useState('');

  const handleAddRole = (roleId: string) => {
    if (!roleId || values.includes(roleId)) return;
    onChange([...values, roleId]);
  };

  const handleRemoveRole = (roleId: string) => {
    onChange(values.filter((id) => id !== roleId));
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleAddRole(manualInput.trim());
      setManualInput('');
    }
  };

  const unselectedRoles = roles.filter((r) => !values.includes(r.id));

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Selected Role Badges */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1.5 rounded-lg border border-white/10 bg-black/30">
        {values.length === 0 ? (
          <span className="text-[11px] text-zinc-500 italic px-1 self-center">No roles selected yet</span>
        ) : (
          values.map((roleId) => {
            const matched = roles.find((r) => r.id === roleId);
            const roleName = matched?.name || roleId;
            const roleColor =
              matched?.color && typeof matched.color === 'number' && matched.color > 0
                ? `#${matched.color.toString(16).padStart(6, '0')}`
                : '#5865f2';

            return (
              <span
                key={roleId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.08] text-white text-[11px] font-medium border border-white/10 shadow-sm"
              >
                <span
                  className="size-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: roleColor }}
                />
                <span className="text-zinc-400">@</span>
                <span>{roleName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRole(roleId)}
                  className="ml-1 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Remove role"
                >
                  &times;
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Role Picker */}
      {roles.length > 0 ? (
        <Select value="" onValueChange={handleAddRole}>
          <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-white text-xs h-8">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-[#12141c] border-white/10 text-white shadow-2xl max-h-60">
            <SelectGroup>
              <SelectLabel className="text-[10px] uppercase font-mono text-zinc-400 flex items-center gap-1.5">
                <Shield className="size-3 text-[#5865f2]" /> Select Role to Add
              </SelectLabel>
              {unselectedRoles.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs focus:bg-white/[0.08] focus:text-white cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-full inline-block shrink-0"
                      style={{
                        backgroundColor:
                          typeof r.color === 'number' && r.color > 0
                            ? `#${r.color.toString(16).padStart(6, '0')}`
                            : '#5865f2'
                      }}
                    />
                    <span className="text-[#5865f2]">@</span>
                    <span className="font-medium">{r.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <form onSubmit={handleManualAdd} className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type role ID or name and press Add..."
            className="text-xs bg-white/[0.04] border-white/10 text-white h-8 font-mono"
          />
          <Button type="submit" size="sm" variant="outline" className="text-xs h-8 px-3 border-white/10">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}

