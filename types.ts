
export enum PlayerRole {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-Rounder',
  WICKET_KEEPER = 'Wicket-Keeper'
}

export enum PlayerStatus {
  AVAILABLE = 'Available',
  SOLD = 'Sold',
  UNSOLD = 'Unsold'
}

export interface PlayerStats {
  matches: number;
  runs?: number;
  average?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  best?: string;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  country: string;
  basePrice: number;
  stats: PlayerStats;
  status: PlayerStatus;
  soldPrice?: number;
  teamId?: string;
  image?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  isWicketKeeper?: boolean;
  availableDates?: string;
}

export interface Team {
  id: string;
  name: string;
  owner: string;
  iconPlayer?: string; // New field for Icon Player name
  budget: number;
  maxBudget: number;
  players: string[]; // Player IDs
  color: string;
}

export interface AuctionState {
  currentPlayerId: string | null;
  currentBid: number;
  highestBidderId: string | null;
  history: string[];
}
