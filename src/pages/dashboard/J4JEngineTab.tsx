import { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Database,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RoleSelect } from '@/components/DiscordResourceSelectors';
import type { DiscordGuild, WorkspaceCustomizations, GuildResources, J4JAuditEntry } from '@/types';

interface J4JEngineTabProps {
  guild: DiscordGuild | null;
  config: WorkspaceCustomizations;
  resources: GuildResources;
  onChangeConfig: (updated: Partial<WorkspaceCustomizations>) => void;
  addToast: (variant: 'success' | 'info' | 'warning' | 'error', title: string, body: string) => void;
}

const DEFAULT_AUDIT_LOG: J4JAuditEntry[] = [];

export function J4JEngineTab({
  guild,
  config,
  resources,
  onChangeConfig,
  addToast
}: J4JEngineTabProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const j4jActive = config.j4jEnabled !== false;
  const credits = config.joinCredits ?? 24;
  const dailyTarget = config.j4jDailyTarget ?? 50;
  const minAccountAge = config.j4jMinAccountAgeDays ?? 14;
  const requireAvatar = config.j4jRequireAvatar !== false;
  const requireEmail = config.j4jRequireEmail !== false;
  const blockChurn = config.j4jBlockChurn !== false;

  const clientId = '1552165138017165372';
  const redirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/discord/callback`
    : 'https://civlink.xyz/auth/discord/callback';
  const oauthJoinUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify+guilds+guilds.join`;

  const auditLog: J4JAuditEntry[] = config.j4jAuditLog && config.j4jAuditLog.length > 0
    ? config.j4jAuditLog
    : DEFAULT_AUDIT_LOG;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(oauthJoinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast('success', 'OAuth2 Link Copied', 'Direct network join URL copied with identify, guilds, and guilds.join scopes.');
  };

  const handleCopyCurl = () => {
    const curlCommand = `curl -X PUT "https://discord.com/api/v10/guilds/${guild?.id || '{guild.id}'}/members/{user.id}" \\
  -H "Authorization: Bot YOUR_BOT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"access_token": "USER_ACCESS_TOKEN", "roles": ["${config.j4jRewardRoleId || 'ROLE_ID'}"]}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    addToast('success', 'Endpoint Snippet Copied', 'Discord REST API PUT call copied to clipboard.');
  };

  const handleExportAuditJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `j4j-audit-${guild?.id || 'server'}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('info', 'Audit Exported', 'Downloaded immutable arrival audit log.');
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Users className="size-4 text-zinc-300" />
              Join-to-Join (J4J) Reciprocal Growth Engine
            </h2>
            <Badge
              variant={j4jActive ? 'default' : 'outline'}
              className={
                j4jActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono'
                  : 'text-zinc-500 border-zinc-700 text-[10px] font-mono'
              }
            >
              {j4jActive ? 'CAMPAIGN ACTIVE' : 'CAMPAIGN PAUSED'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Automates reciprocal member growth across verified ER:LC communities via Discord OAuth2 <code className="font-mono text-zinc-300">guilds.join</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-md border border-white/[0.06]">
            <Label htmlFor="j4j-status-toggle" className="text-xs text-zinc-300 cursor-pointer">
              Reciprocal Routing
            </Label>
            <Switch
              id="j4j-status-toggle"
              checked={j4jActive}
              onCheckedChange={(checked) => onChangeConfig({ j4jEnabled: checked })}
            />
          </div>
        </div>
      </div>

      {/* Credit & Balance Architecture Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Guild Credit Balance</span>
              <Badge className="bg-zinc-800 text-zinc-300 text-[10px] font-mono border-white/[0.08]">
                RATIO 1:1
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-white">{credits}</span>
              <span className="text-xs text-zinc-400">Join Credits</span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              +1 credit when server member authorizes network entry.
              -1 credit when reciprocal civilian is added to your guild.
            </div>
          </CardContent>
        </Card>

        {/* Daily Cap & Protection */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Daily Target Limit</span>
              <Badge className="bg-zinc-800 text-zinc-300 text-[10px] font-mono border-white/[0.08]">
                AUTO-PAUSE PROTECT
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={500}
                value={dailyTarget}
                onChange={(e) => onChangeConfig({ j4jDailyTarget: parseInt(e.target.value) || 50 })}
                className="h-8 font-mono text-xs bg-black/40 border-white/10 w-24 text-white"
              />
              <span className="text-xs text-zinc-400">members / 24 hours</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Campaign pauses automatically if balance drops to 0 or daily quota is fulfilled.
            </div>
          </CardContent>
        </Card>

        {/* Reward Role */}
        <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase text-zinc-400">Assigned Reward Role</span>
              <Badge className="bg-zinc-800 text-zinc-300 text-[10px] font-mono border-white/[0.08]">
                INSTANT GRANT
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            <RoleSelect
              roles={resources.roles}
              value={config.j4jRewardRoleId || ''}
              onChange={(val) => onChangeConfig({ j4jRewardRoleId: val })}
              placeholder="Select Reward Role (e.g. @Verified Civilian)"
            />
            <div className="text-[11px] text-zinc-400">
              Role granted directly via Discord API <code className="font-mono text-zinc-300">roles: [roleId]</code> upon arrival.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reciprocal OAuth2 Link & REST Spec Card */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-zinc-300" />
              <CardTitle className="text-sm font-semibold tracking-tight text-white">
                Reciprocal Server Joining REST Specification
              </CardTitle>
            </div>
            <button
              onClick={handleCopyCurl}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
            >
              {copiedCurl ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Authorization gateway payload executed by backend upon receiving authorization code:
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="rounded-md border border-white/[0.06] bg-black/60 p-3 font-mono text-xs text-zinc-300 overflow-x-auto space-y-1">
            <div className="text-zinc-500">// Discord REST v10 Endpoint:</div>
            <div className="text-emerald-400">
              PUT https://discord.com/api/v10/guilds/{guild?.id || '{guild.id}'}/members/{'{user.id}'}
            </div>
            <div className="text-zinc-500 pt-1">// Request Body Payload:</div>
            <div className="text-zinc-300">
              {'{'} "access_token": "USER_OAUTH_TOKEN", "roles": ["{config.j4jRewardRoleId || 'CONFIGURED_ROLE_ID'}"] {'}'}
            </div>
          </div>

          {/* Public OAuth2 Join Link Generator */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="text-zinc-300 font-medium">Community Network Join URL</Label>
              <span className="text-[11px] text-zinc-400 font-mono">
                Scopes: identify, guilds, guilds.join
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                readOnly
                value={oauthJoinUrl}
                className="font-mono text-xs bg-black/40 border-white/10 text-zinc-300 select-all"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-9 px-3 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white shrink-0 rounded-md"
              >
                {copiedLink ? <Check className="size-3.5 mr-1.5 text-emerald-400" /> : <Copy className="size-3.5 mr-1.5" />}
                {copiedLink ? 'Copied Link' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anti-Alt & Fraud Verification Settings */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-400" />
            <CardTitle className="text-sm font-semibold tracking-tight text-white">
              Anti-Alt &amp; Member Churn Fraud Protection
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Rigid verification gates applied to each incoming user before adding them to your server.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Age Requirement */}
            <div className="p-3.5 rounded-md border border-white/[0.06] bg-black/30 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-white">Minimum Discord Account Age</Label>
                <span className="text-xs font-mono text-zinc-400">{minAccountAge} Days</span>
              </div>
              <Input
                type="number"
                min={7}
                max={365}
                value={minAccountAge}
                onChange={(e) => onChangeConfig({ j4jMinAccountAgeDays: parseInt(e.target.value) || 14 })}
                className="h-8 font-mono text-xs bg-black/40 border-white/10 text-white"
              />
              <p className="text-[11px] text-zinc-400">
                Accounts created less than {minAccountAge} days ago are rejected immediately.
              </p>
            </div>

            {/* 30-Day Churn Prevention */}
            <div className="p-3.5 rounded-md border border-white/[0.06] bg-black/30 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-white block">30-Day Churn Guard</Label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Blocks members who left within 30 days from rejoining for credits.
                  </p>
                </div>
                <Switch
                  checked={blockChurn}
                  onCheckedChange={(checked) => onChangeConfig({ j4jBlockChurn: checked })}
                />
              </div>
              <Badge className="bg-zinc-800 text-zinc-400 text-[10px] font-mono border-white/[0.06] w-fit">
                CHURN PREVENTION
              </Badge>
            </div>

            {/* Require Avatar */}
            <div className="p-3.5 rounded-md border border-white/[0.06] bg-black/30 flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-white block">Avatar Verification</Label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Reject default Discord avatar hashes to deter bot spam.
                </p>
              </div>
              <Switch
                checked={requireAvatar}
                onCheckedChange={(checked) => onChangeConfig({ j4jRequireAvatar: checked })}
              />
            </div>

            {/* Require Verified Email */}
            <div className="p-3.5 rounded-md border border-white/[0.06] bg-black/30 flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold text-white block">Verified Email Flag</Label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Requires user.verified === true on Discord token object.
                </p>
              </div>
              <Switch
                checked={requireEmail}
                onCheckedChange={(checked) => onChangeConfig({ j4jRequireEmail: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Immutable Audit Log Table */}
      <Card className="border-white/[0.08] bg-[#161a24] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <CardHeader className="pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold tracking-tight text-white">
                  Real-Time Arrival Audit Log
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Immutable event stream of network join authorizations and fraud checks.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditJson}
              className="h-8 px-3 text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 rounded-md"
            >
              <Download className="size-3.5 mr-1.5" />
              Export JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">User &amp; Discord ID</th>
                  <th className="px-4 py-3">Arrival Timestamp</th>
                  <th className="px-4 py-3">Role Granted</th>
                  <th className="px-4 py-3">Account Age</th>
                  <th className="px-4 py-3">Fraud Flags</th>
                  <th className="px-4 py-3 text-right">Join Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{entry.username}</div>
                      <div className="font-mono text-[11px] text-zinc-400">{entry.userId}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {entry.timestamp}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      @{entry.roleGranted}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {entry.accountAgeDays} days
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            entry.hasAvatar
                              ? 'bg-white/[0.05] text-zinc-300 border border-white/10'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {entry.hasAvatar ? 'AVATAR_OK' : 'DEFAULT_AVATAR'}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            entry.hasVerifiedEmail
                              ? 'bg-white/[0.05] text-zinc-300 border border-white/10'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {entry.hasVerifiedEmail ? 'EMAIL_VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={entry.status === 'success' ? 'default' : 'destructive'}
                        className={
                          entry.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-mono'
                        }
                      >
                        {entry.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
