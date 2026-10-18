export interface DiscordUser {
  id: string;
  username: string;
  globalName: string;
  avatar: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  hasWorkspace?: boolean;
  configured?: boolean;
  approximateMemberCount?: number;
  memberCount?: number;
}

export interface TicketCategoryConfig {
  id: string;
  name: string;
  spawnCategoryId: string;
  pingRoleId: string;
  claimRoleId?: string;
  initialInstructions?: string;
  description?: string;
  emoji?: string;
}

export interface J4JAuditEntry {
  id: string;
  userId: string;
  username: string;
  targetGuildId: string;
  targetGuildName: string;
  timestamp: string;
  roleGranted: string;
  status: 'success' | 'failed';
  accountAgeDays: number;
  hasAvatar: boolean;
  hasVerifiedEmail: boolean;
}

export interface RadioFrequency {
  id: string;
  frequency: string;
  name: string;
  channelId: string;
  roleId?: string;
}

export interface StaffLoaRequest {
  id: string;
  staffId: string;
  staffTag: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface StaffInfraction {
  id: string;
  staffId: string;
  staffTag: string;
  type: 'warn' | 'strike' | 'demote';
  reason: string;
  issuedBy: string;
  timestamp: string;
}

export interface ApplicationQuestion {
  id: string;
  text: string;
  type: 'short' | 'paragraph' | 'choice';
  required: boolean;
}

export interface CustomStaffApplication {
  id: string;
  name: string;
  open: boolean;
  delivery: 'channel' | 'dm' | 'both';
  reviewChannelId: string;
  resultsChannelId: string;
  passedRoleId?: string;
  passedRoleIds?: string[];
  questions: ApplicationQuestion[];
}

export interface WorkspaceCustomizations {
  serverName?: string;
  joinCode?: string;
  botActivityText?: string;
  panelTitle?: string;
  panelDescription?: string;
  panelDesign?: 'v2' | 'classic';
  panelLayout?: 'buttons' | 'select' | 'both';
  panelColor?: string;
  buttonPlacement?: 'outside' | 'inside';
  appPanelTitle?: string;
  appPanelDesc?: string;
  appPanelTopBannerUrl?: string;
  appPanelBottomBannerUrl?: string;
  appPanelChannelId?: string;
  appPanelColor?: string;
  promotionRemoveRoleId?: string;
  staffDocsContent?: string;
  rulesTitle?: string;
  rulesDescription?: string;
  showRulesButton?: boolean;
  rulesButtonLabel?: string;
  rulesButtonStyle?: number;
  ticketCategories?: TicketCategoryConfig[];
  ticketPingRoleId?: string;
  ticketClaimRoleId?: string;
  transcriptsChannelId?: string;
  ticketCategoryId?: string;
  topBannerUrl?: string;
  bottomBannerUrl?: string;
  ticketInsideBannerUrl?: string;
  ticketOpenMessage?: string;
  sessionTopBannerUrl?: string;
  sessionShutdownBannerUrl?: string;
  sessionBottomBannerUrl?: string;
  sessionVoteTopBannerUrl?: string;
  sessionVoteBottomBannerUrl?: string;
  sessionChannelId?: string;
  ingameVcId?: string;
  queueVcId?: string;
  notificationRoleId?: string;
  hostRoleId?: string;
  sessionStartTitle?: string;
  sessionStartDesc?: string;
  sessionShutdownTitle?: string;
  sessionShutdownDesc?: string;
  appTitle?: string;
  appDescription?: string;
  appTopBannerUrl?: string;
  appBottomBannerUrl?: string;
  reviewChannelId?: string;
  resultsChannelId?: string;
  ingameQuestions?: string;
  discordQuestions?: string;
  appQuizIntroText?: string;
  appIngameOpen?: boolean;
  appDiscordOpen?: boolean;
  staffDocsTitle?: string;
  staffDocsDescription?: string;
  staffDocsLayout?: 'select' | 'buttons';
  staffDocsTopBannerUrl?: string;
  staffDocsBottomBannerUrl?: string;
  staffDocsChannelId?: string;
  welcomeEnabled?: boolean;
  welcomeChannelId?: string;
  welcomeText?: string;
  welcomeBannerUrl?: string;
  promotionsChannelId?: string;
  promotionStaffRoleId?: string;
  promotionGiveRoleId?: string;
  promoteBannerUrl?: string;
  promotionBottomBannerUrl?: string;
  infractionsChannelId?: string;
  infractionStaffRoleId?: string;
  infractRemoveRoleId?: string;
  infractGiveRoleId?: string;
  infractBannerUrl?: string;
  infractionBottomBannerUrl?: string;
  deptChannelId?: string;
  deptBannerUrl?: string;
  regulationsBannerUrl?: string;
  regulationsChannelId?: string;
  quotaRequirement?: string;
  quotaChannelId?: string;
  forumChannelId?: string;
  dailyQuestionsChannelId?: string;
  dailyQuestionsTime?: string;
  botStaffRoleId?: string;
  adminRoleId?: string;
  staffRoleIds?: string[];
  aiProvider?: string;
  aiModel?: string;
  aiSystemInstructions?: string;
  sessionColor?: string;
  sessionBannerUrl?: string;
  supervisorRoleId?: string;
  promotionTargetRoleId?: string;
  infractionStrikeThreshold?: string;
  infractionDemoteRoleId?: string;
  j4jEnabled?: boolean;
  j4jRewardRoleId?: string;
  j4jDailyTarget?: number;
  j4jMinAccountAgeDays?: number;
  j4jRequireAvatar?: boolean;
  j4jRequireEmail?: boolean;
  j4jBlockChurn?: boolean;
  joinCredits?: number;
  radioFrequencies?: RadioFrequency[];
  radioAutoSync?: boolean;
  sessionState?: 'OFFLINE' | 'VOTE_ACTIVE' | 'PATROL_LIVE' | 'CONCLUDED';
  sessionQuorumVotes?: number;
  staffLoaRequests?: StaffLoaRequest[];
  staffInfractions?: StaffInfraction[];
  j4jAuditLog?: J4JAuditEntry[];
  [key: string]: any;
}

export interface WorkspaceBot {
  id: string;
  guildId: string;
  isMainBot?: boolean;
  discordBotId: string | null;
  botUser?: {
    id: string;
    username: string;
    avatarUrl: string;
  } | null;
  isInGuild: boolean | null;
  inviteUrl: string | null;
  status: 'online' | 'offline' | 'unconfigured' | 'suspended' | string;
  createdAt: string;
  updatedAt: string;
  hasDiscordToken: boolean;
  hasErlcApiKey: boolean;
  hasAiApiKey: boolean;
  customizations: WorkspaceCustomizations;
}

export interface LiveErlcServer {
  state: 'connected' | 'not_configured' | 'unavailable';
  name?: string | null;
  joinCode?: string | null;
  currentPlayers?: number | null;
  maxPlayers?: number | null;
  queue?: number | null;
  staffCount?: number | null;
  error?: string;
  fetchedAt?: string;
}

export interface DiscordChannelOption {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
}

export interface DiscordRoleOption {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface GuildResources {
  available: boolean;
  channels: DiscordChannelOption[];
  roles: DiscordRoleOption[];
}
