export interface PlayerStats {
  name: string;
  final_stack: number;
  total_buyin: number;
  net_profit: number;
  hands_played: number;
  hands_won: number;
  win_rate: number;
  vpip: number;
  style: [string, string];
  folded_by_street: {
    preflop: number;
    flop: number;
    turn: number;
    river: number;
  };
  fold_percentage: number;
  style_coordinates: { x: number; y: number };
  showdown_percentage?: number;
  showdown_win_rate?: number;
  aggression_factor?: number;
}

export interface PokerStats {
  total_hands: number;
  hand_endings: {
    preflop: number;
    flop: number;
    turn: number;
    river: number;
  };
  players: {
    [key: string]: PlayerStats;
  };
} 