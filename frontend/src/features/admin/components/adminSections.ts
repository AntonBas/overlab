import {
  ArrowLeftRight,
  BookOpen,
  Database,
  Hammer,
  Map,
  ScrollText,
  Sparkles,
  Swords,
  Tags,
  UserCog,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface AdminSection {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    to: "/admin/heroes",
    label: "Heroes",
    description: "Names, roles, portraits and visibility",
    icon: Swords,
  },
  {
    to: "/admin/abilities",
    label: "Abilities",
    description: "Hero abilities and their descriptions",
    icon: Zap,
  },
  {
    to: "/admin/perks",
    label: "Perks",
    description: "Minor and major perks of every hero",
    icon: Sparkles,
  },
  {
    to: "/admin/relations",
    label: "Counters and synergies",
    description: "Curated counter-picks and synergies",
    icon: ArrowLeftRight,
  },
  {
    to: "/admin/categories",
    label: "Hero categories",
    description: "Subroles and hero groupings",
    icon: Tags,
  },
  {
    to: "/admin/guides",
    label: "Guides",
    description: "Guides and videos",
    icon: BookOpen,
  },
  {
    to: "/admin/patches",
    label: "Patches",
    description: "Patch dates and notes",
    icon: Hammer,
  },
  {
    to: "/admin/maps",
    label: "Maps",
    description: "Maps, modes and images",
    icon: Map,
  },
  {
    to: "/admin/users",
    label: "Users",
    description: "Accounts, roles and access",
    icon: UserCog,
  },
  {
    to: "/admin/collector",
    label: "Collector",
    description: "Scheduled jobs and run history",
    icon: Database,
  },
  {
    to: "/admin/audit",
    label: "Audit log",
    description: "Who changed what and when",
    icon: ScrollText,
  },
];

export const LEAVE_WARNING = "You have unsaved changes. Leave this page?";
