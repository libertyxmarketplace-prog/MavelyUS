import {
  ActivityIcon,
  AudioLinesIcon,
  BellIcon,
  BotIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChartLineIcon,
  CoinsIcon,
  CreditCardIcon,
  FileTextIcon,
  FolderIcon,
  GitBranchIcon,
  GraduationCapIcon,
  HeartPulseIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  KeyIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  ListIcon,
  ListTodoIcon,
  MailIcon,
  MegaphoneIcon,
  MessageCircleIcon,
  MessageSquareHeartIcon,
  PackageIcon,
  PlugIcon,
  ReceiptIcon,
  ServerIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  SparklesIcon,
  StickyNoteIcon,
  TriangleAlertIcon,
  UserRoundIcon,
  UsersIcon,
  WalletIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"

import { type NavIconName } from "@/lib/nav-config"

/**
 * The one place a `NavIconName` becomes a drawable component. A NavConfig is
 * plain data — it has to survive a server module, a template manifest, and the
 * trip across the client boundary — so it names its icons instead of holding
 * them. The `Record<NavIconName, LucideIcon>` annotation is the guarantee: a
 * name added to the union stops this file compiling until it has an entry.
 */
const NAV_ICONS: Record<NavIconName, LucideIcon> = {
  "layout-dashboard": LayoutDashboardIcon,
  users: UsersIcon,
  "user-round": UserRoundIcon,
  "shopping-cart": ShoppingCartIcon,
  receipt: ReceiptIcon,
  "credit-card": CreditCardIcon,
  settings: SettingsIcon,
  bell: BellIcon,
  inbox: InboxIcon,
  calendar: CalendarIcon,
  activity: ActivityIcon,
  shield: ShieldIcon,
  key: KeyIcon,
  "key-round": KeyRoundIcon,
  plug: PlugIcon,
  "chart-line": ChartLineIcon,
  "file-text": FileTextIcon,
  "life-buoy": LifeBuoyIcon,
  server: ServerIcon,
  sparkles: SparklesIcon,
  package: PackageIcon,
  megaphone: MegaphoneIcon,
  "git-branch": GitBranchIcon,
  "alert-triangle": TriangleAlertIcon,
  list: ListIcon,
  home: HomeIcon,
  briefcase: BriefcaseIcon,
  building: BuildingIcon,
  "graduation-cap": GraduationCapIcon,
  "heart-pulse": HeartPulseIcon,
  coins: CoinsIcon,
  folder: FolderIcon,
  "sticky-note": StickyNoteIcon,
  "message-circle": MessageCircleIcon,
  "list-todo": ListTodoIcon,
  bot: BotIcon,
  image: ImageIcon,
  "audio-lines": AudioLinesIcon,
  wallet: WalletIcon,
  workflow: WorkflowIcon,
  mail: MailIcon,
  "message-square-heart": MessageSquareHeartIcon,
}

/** The component for a name, or undefined for an item that carries no icon. */
function navIcon(name?: NavIconName): LucideIcon | undefined {
  return name ? NAV_ICONS[name] : undefined
}

export { NAV_ICONS, navIcon }
