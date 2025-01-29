import re
import pandas as pd
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple

@dataclass
class Player:
    name: str
    id: str
    current_stack: float
    total_buyin: float = 0.0
    hands_played: int = 0
    hands_won: int = 0
    total_won: float = 0.0
    hands_folded_preflop: int = 0
    hands_folded_flop: int = 0
    hands_folded_turn: int = 0
    hands_folded_river: int = 0
    
    # New tracking fields
    hands_went_to_showdown: int = 0
    hands_won_at_showdown: int = 0
    total_bets_and_raises: int = 0
    total_calls: int = 0
    hands_saw_flop: int = 0  # New field to track flop sees
    stood_up: bool = False

    @property
    def net_profit(self) -> float:
        return self.current_stack - self.total_buyin
        
    @property
    def vpip_percentage(self) -> float:
        if self.hands_played == 0:
            return 0.0
        return ((self.hands_played - self.hands_folded_preflop) / self.hands_played) * 100
        
    @property
    def fold_percentage(self) -> float:
        total_folds = (self.hands_folded_preflop + self.hands_folded_flop + 
                      self.hands_folded_turn + self.hands_folded_river)
        if self.hands_played == 0:
            return 0.0
        return (total_folds / self.hands_played) * 100

    @property
    def win_rate(self) -> float:
        if self.hands_played == 0:
            return 0.0
        return self.hands_won / self.hands_played

    @property
    def showdown_percentage(self) -> float:
        """Percentage of hands that went to showdown when seeing flop"""
        if self.hands_saw_flop == 0:
            return 0.0
        return (self.hands_went_to_showdown / self.hands_saw_flop) * 100
    
    @property
    def showdown_win_rate(self) -> float:
        """Win rate when reaching showdown"""
        if self.hands_went_to_showdown == 0:
            return 0.0
        return (self.hands_won_at_showdown / self.hands_went_to_showdown) * 100
    
    @property
    def aggression_factor(self) -> float:
        """Ratio of aggressive actions (bets/raises) to passive actions (calls)"""
        if self.total_calls == 0:
            return 0.0
        return self.total_bets_and_raises / self.total_calls

    def get_style_rating(self) -> tuple[str, str]:
        if self.vpip_percentage > 40:
            loose_tight = "Very Loose"
        elif self.vpip_percentage > 30:
            loose_tight = "Loose"
        elif self.vpip_percentage > 20:
            loose_tight = "Regular L/T"
        elif self.vpip_percentage > 10:
            loose_tight = "Tight"
        else:
            loose_tight = "Very Tight"
            
        # Use aggression factor instead of fold percentage
        if self.aggression_factor > 2.0:
            passive_aggressive = "Very Aggressive"
        elif self.aggression_factor > 1.5:
            passive_aggressive = "Aggressive"
        elif self.aggression_factor > 1.0:
            passive_aggressive = "Regular P/A"
        elif self.aggression_factor > 0.5:
            passive_aggressive = "Passive"
        else:
            passive_aggressive = "Very Passive"
            
        return loose_tight, passive_aggressive

    def get_style_coordinates(self) -> dict:
        # VPIP (Loose-Tight axis)
        x_coord = (self.vpip_percentage - 25) / 30  # Centered at 25%, range of 30%
        
        # Aggression (Passive-Aggressive axis)
        # Using aggression factor as primary indicator
        # Typical aggression factors: 0.5 = passive, 1.0 = neutral, 2.0 = aggressive
        y_coord = (self.aggression_factor - 1.0) / 1.0  # Centered at 1.0
        
        # Clamp values between -1 and 1
        x_coord = max(min(x_coord, 1), -1)
        y_coord = max(min(y_coord, 1), -1)
        
        return {
            "x": x_coord,  # -1 (Tight) to 1 (Loose)
            "y": y_coord   # -1 (Passive) to 1 (Aggressive)
        }

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "final_stack": self.current_stack,
            "total_buyin": self.total_buyin,
            "net_profit": self.net_profit,
            "hands_played": self.hands_played,
            "hands_won": self.hands_won,
            "win_rate": self.win_rate,
            "vpip": self.vpip_percentage,
            "style": self.get_style_rating(),
            "folded_by_street": {
                "preflop": self.hands_folded_preflop,
                "flop": self.hands_folded_flop,
                "turn": self.hands_folded_turn,
                "river": self.hands_folded_river
            },
            "fold_percentage": self.fold_percentage,
            "style_coordinates": self.get_style_coordinates(),
            "showdown_percentage": self.showdown_percentage,
            "showdown_win_rate": self.showdown_win_rate,
            "aggression_factor": self.aggression_factor
        }

class PokerGameAnalyzer:
    def __init__(self, log_file: str):
        self.log_file = log_file
        self.players: Dict[str, Player] = {}
        self.total_hands = 0
        self.hands_ended_preflop = 0
        self.hands_ended_flop = 0
        self.hands_ended_turn = 0
        self.hands_ended_river = 0
        self.current_hand: Optional[dict] = None
        self.active_players: Set[str] = set()
        self.run_twice = False
        self.last_known_stacks: Dict[str, float] = {}  # Track last known stack for each player
        self.current_hand_lines = []  # Add this line to track recent entries
        
    def analyze(self):
        df = pd.read_csv(self.log_file)
        
        print("Starting analysis...")
        # Process entries in chronological order (oldest to newest)
        for entry in reversed(df['entry'].values):
            self._process_entry(entry)
            
        # Find the last stack update for each player
        last_known_stacks = {}  # Create a new dictionary for the final pass
        
        # Process entries in reverse chronological order (newest to oldest)
        for entry in reversed(df['entry'].values):
            # First check for quit messages as they should take precedence
            quit_match = re.match(r'The player "(.*?) @ (.*?)" quits the game with a stack of ([\d.]+)', entry)
            if quit_match:
                _, player_id, final_stack = quit_match.groups()
                player_id = player_id.strip('"')
                last_known_stacks[player_id] = float(final_stack.rstrip('.'))
                continue

            # Then check stack updates
            stack_match = re.match(r'Player stacks:.*', entry)
            if stack_match:
                parts = entry.split('|')
                for part in parts:
                    if '@' in part:
                        name_id, stack = part.strip().split('(')
                        player_id = name_id.split('@')[1].strip().strip('"')
                        current_stack = float(stack.replace(')', '').strip().rstrip('.'))
                        # Always update to the most recent stack value
                        last_known_stacks[player_id] = current_stack
                
        # Use last known stacks for final values
        for player_id, player in self.players.items():
            if player_id in last_known_stacks:
                final_stack = last_known_stacks[player_id]
                player.current_stack = final_stack

            
        return {
            'total_hands': self.total_hands,
            'hand_endings': {
                'preflop': self.hands_ended_preflop,
                'flop': self.hands_ended_flop,
                'turn': self.hands_ended_turn,
                'river': self.hands_ended_river
            },
            'players': {id: self._player_to_dict(player) for id, player in self.players.items()}
        }

    def _process_entry(self, entry: str):
        # Track new hand starts
        new_hand_match = re.match(r'The game #(\d+) starts\.', entry)
        if new_hand_match:
            self.current_hand_lines = []  # Reset hand lines
            self.active_players = set()   # Track players in current hand
            print(f"\nNew hand starting. Active players reset.")
            
        # Track players standing up (going AFK)
        standup_match = re.match(r'The player "(.*?) @ (.*?)" stand up with the stack of ([\d.]+)', entry)
        if standup_match:
            _, player_id, final_stack = standup_match.groups()
            player_id = player_id.strip('"')  # Clean up any quotes
            self.active_players.discard(player_id)  # Use discard instead of remove
            if player_id in self.players:
                # Update their last known stack
                self.last_known_stacks[player_id] = float(final_stack.rstrip('.'))
                # Mark them as inactive for future hands
                self.players[player_id].current_stack = float(final_stack.rstrip('.'))
                self.players[player_id].stood_up = True
            return
            
        # Track players in the hand
        dealt_match = re.match(r'Dealing down cards to "(.*?) @ (.*?)"', entry)
        if dealt_match:
            _, player_id = dealt_match.groups()
            player_id = player_id.strip('"')  # Clean up any quotes
            # Only count the hand if the player hasn't stood up
            if player_id in self.players and not self.players[player_id].stood_up:
                self.active_players.add(player_id)
                print(f"Player {player_id} dealt in. Active players: {self.active_players}")
            
        # Track flop
        flop_match = re.match(r'Flop:  \[(.*?)\]', entry)
        if flop_match:
            print(f"\nFLOP detected. Active players: {self.active_players}")
            # All players still active at flop have seen it
            for player_id in self.active_players:
                if player_id in self.players:  # Defensive check
                    self.players[player_id].hands_saw_flop += 1
                    print(f"Player {player_id} saw flop. Total flops: {self.players[player_id].hands_saw_flop}")
                
        # Track folds
        fold_match = re.match(r'The player "(.*?) @ (.*?)" folds', entry)
        if fold_match:
            _, player_id = fold_match.groups()
            player_id = player_id.strip('"')  # Clean up any quotes
            self.active_players.discard(player_id)  # Use discard instead of remove
            print(f"Player {player_id} folded. Remaining players: {self.active_players}")

        # Add each entry to current hand lines
        if self.current_hand:
            self.current_hand_lines.append(entry)
        
        # Clear hand lines when a new hand starts
        start_match = re.match(r'-- starting hand #(\d+)', entry)
        if start_match:
            self.current_hand_lines = []
            self.total_hands += 1
            self.current_hand = {
                'number': int(start_match.group(1)),
                'active_players': set(self.active_players)
            }
            for player_id in self.active_players:
                if player_id in self.players:
                    self.players[player_id].hands_played += 1
            return

        # Process player joining with stack
        join_match = re.match(r'The player "(.*?) @ (.*?)" joined the game with a stack of ([\d.]+)', entry)
        if join_match:
            name, player_id, stack = join_match.groups()
            stack = float(stack.rstrip('.'))
            if player_id not in self.players:
                self.players[player_id] = Player(name=name, id=player_id, current_stack=stack, total_buyin=stack)
            else:
                if self.players[player_id].current_stack == 0:
                    self.players[player_id].total_buyin += stack
                self.players[player_id].current_stack = stack
            self.active_players.add(player_id)
            return

        # Process player stacks at hand start
        stack_match = re.match(r'Player stacks:.*', entry)
        if stack_match:
            parts = entry.split('|')
            for part in parts:
                if '@' in part:
                    name_id, stack = part.strip().split('(')
                    player_id = name_id.split('@')[1].strip()
                    current_stack = float(stack.replace(')', '').strip().rstrip('.'))
                    
                    # Update last known stack
                    self.last_known_stacks[player_id] = current_stack
                    
                    if player_id in self.players:
                        # Use stack updates as source of truth
                        self.players[player_id].current_stack = current_stack
            return

        # Track showdown hands and wins
        showdown_match = re.search(r'"(.*?) @ (.*?)" shows', entry)
        if showdown_match:
            _, player_id = showdown_match.groups()
            player_id = player_id.strip('"')  # Clean up any quotes
            if player_id in self.players:
                self.players[player_id].hands_went_to_showdown += 1
                print(f"\nPlayer {player_id} went to showdown. Flops seen: {self.players[player_id].hands_saw_flop}, Total showdowns: {self.players[player_id].hands_went_to_showdown}")
                
                # Check if this player won at showdown
                for recent_line in self.current_hand_lines[-5:]:
                    try:
                        win_match = re.search(f'"{showdown_match.group(1)} @ {player_id}" collected', recent_line)
                        if win_match:
                            self.players[player_id].hands_won_at_showdown += 1
                            break
                    except Exception as e:
                        print(f"Error processing showdown win for {player_id}: {e}")

        # Track betting actions
        try:
            action_match = re.search(r'"(.*?) @ (.*?)" (raises|bets|calls)', entry)
            if action_match:
                _, player_id, action = action_match.groups()
                player_id = player_id.strip('"')  # Clean up any quotes
                if player_id in self.players:
                    if action in ['raises', 'bets']:
                        self.players[player_id].total_bets_and_raises += 1
                        print(f"\nPlayer {player_id} bet/raised. Total aggressive: {self.players[player_id].total_bets_and_raises}")
                    elif action == 'calls':
                        self.players[player_id].total_calls += 1
                        print(f"\nPlayer {player_id} called. Total calls: {self.players[player_id].total_calls}")
        except Exception as e:
            print(f"Error processing betting action: {e}")

        # Process player quitting
        quit_match = re.match(r'The player "(.*?) @ (.*?)" quits the game with a stack of ([\d.]+)', entry)
        if quit_match:
            _, player_id, final_stack = quit_match.groups()
            player_id = player_id.strip('"')  # Clean up any quotes
            if player_id in self.players:
                final_stack = float(final_stack.rstrip('.'))
                self.players[player_id].current_stack = final_stack
                self.last_known_stacks[player_id] = final_stack
                self.active_players.discard(player_id)  # Use discard instead of remove
            return

        # Process pot collection - no longer updating current_stack here
        collect_match = re.match(r'"(.*?) @ (.*?)" collected ([\d.]+) from pot', entry)
        if collect_match:
            _, player_id, amount = collect_match.groups()
            amount = float(amount.rstrip('.'))
            if player_id in self.players:
                self.players[player_id].hands_won += 1
                self.players[player_id].total_won += amount
                # Removed current_stack update as it's handled by stack updates
            return

        # Process folding actions
        fold_match = re.match(r'"(.*?) @ (.*?)" folds', entry)
        if fold_match:
            _, player_id = fold_match.groups()
            if player_id in self.players and self.current_hand:
                if not self.current_hand.get('flop'):
                    self.players[player_id].hands_folded_preflop += 1
                elif not self.current_hand.get('turn'):
                    self.players[player_id].hands_folded_flop += 1
                elif not self.current_hand.get('river'):
                    self.players[player_id].hands_folded_turn += 1
                else:
                    self.players[player_id].hands_folded_river += 1
            return

        # Process street cards
        flop_match = re.match(r'Flop:  \[(.*?)\]', entry)
        if flop_match:
            if self.current_hand:
                self.current_hand['flop'] = flop_match.group(1)
            return

        turn_match = re.match(r'Turn: (.*?) \[(.*?)\]', entry)
        if turn_match:
            if self.current_hand:
                self.current_hand['turn'] = turn_match.group(2)
            return

        river_match = re.match(r'River: (.*?) \[(.*?)\]', entry)
        if river_match:
            if self.current_hand:
                self.current_hand['river'] = river_match.group(2)
            return

        # Process hand end
        if "-- ending hand" in entry:
            if self.current_hand:
                if not self.current_hand.get('flop'):
                    self.hands_ended_preflop += 1
                elif not self.current_hand.get('turn'):
                    self.hands_ended_flop += 1
                elif not self.current_hand.get('river'):
                    self.hands_ended_turn += 1
                else:
                    self.hands_ended_river += 1
            self.current_hand = None
            return

    def _player_to_dict(self, player: Player) -> dict:
        return {
            "name": player.name,
            "final_stack": player.current_stack,
            "total_buyin": player.total_buyin,
            "net_profit": player.net_profit,
            "hands_played": player.hands_played,
            "hands_won": player.hands_won,
            "win_rate": player.win_rate,
            "folded_by_street": {
                "preflop": player.hands_folded_preflop,
                "flop": player.hands_folded_flop,
                "turn": player.hands_folded_turn,
                "river": player.hands_folded_river
            },
            "vpip": player.vpip_percentage,
            "style": player.get_style_rating(),
            "style_coordinates": player.get_style_coordinates(),
            "showdown_percentage": player.showdown_percentage,
            "showdown_win_rate": player.showdown_win_rate,
            "aggression_factor": player.aggression_factor
        }