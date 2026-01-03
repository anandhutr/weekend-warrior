
import { PlayerStatus, Player, Team } from './types';

export const INITIAL_BUDGET = 1000; // 1000 INR

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Mumbai Titans', owner: 'R. Ambani', budget: INITIAL_BUDGET, maxBudget: INITIAL_BUDGET, players: [], color: 'bg-blue-600' },
  { id: 't2', name: 'Chennai Kings', owner: 'N. Srinivasan', budget: INITIAL_BUDGET, maxBudget: INITIAL_BUDGET, players: [], color: 'bg-yellow-500' },
  { id: 't3', name: 'Bangalore Blasters', owner: 'Vijay M.', budget: INITIAL_BUDGET, maxBudget: INITIAL_BUDGET, players: [], color: 'bg-red-600' },
  { id: 't4', name: 'Delhi Capitals', owner: 'Jindal G.', budget: INITIAL_BUDGET, maxBudget: INITIAL_BUDGET, players: [], color: 'bg-indigo-600' },
];

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Virat Kohli',
    role: 'Batsman',
    country: 'India',
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm medium',
    isWicketKeeper: false,
    availableDates: 'Full Season',
    basePrice: 200,
    status: PlayerStatus.AVAILABLE,
    image: 'https://picsum.photos/seed/virat/400/400',
    stats: { matches: 234, runs: 7263, wickets: 4 }
  },
  {
    id: 'p2',
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    country: 'India',
    battingStyle: 'Right-handed',
    bowlingStyle: 'Right-arm fast',
    isWicketKeeper: false,
    availableDates: 'Full Season',
    basePrice: 200,
    status: PlayerStatus.AVAILABLE,
    image: 'https://picsum.photos/seed/bumrah/400/400',
    stats: { matches: 120, runs: 120, wickets: 145 }
  }
];
