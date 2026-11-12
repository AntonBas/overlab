export type GameQueue = "QUICK_PLAY" | "COMPETITIVE";

export type RankTier =
  | "ALL"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "EMERALD"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";

export type Platform = "PC" | "CONSOLE";

export type Region = "EUROPE" | "AMERICAS" | "ASIA";

export type StatsSort = "PICK_RATE" | "WIN_RATE" | "BAN_RATE" | "NAME";

export type SortDirection = "ASC" | "DESC";

export interface ApiErrorBody {
  status: string;
  statusCode: number;
  timestamp: string;
  message: string;
  path: string;
  subErrors: { field: string; message: string }[];
}
