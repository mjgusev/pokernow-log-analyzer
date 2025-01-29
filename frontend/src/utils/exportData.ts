import { PokerStats } from '../types/poker';

export const exportSessionData = (stats: Partial<PokerStats>) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `poker_session_${timestamp}.json`;
  
  // Format the data for export
  const exportData = {
    sessionDate: timestamp,
    totalHands: stats.total_hands,
    handEndingsByStreet: stats.hand_endings,
    players: Object.values(stats.players).map((player: any) => ({
      name: player.name,
      financial: {
        buyIn: player.total_buyin,
        finalStack: player.final_stack,
        netProfit: player.net_profit
      },
      performance: {
        handsPlayed: player.hands_played,
        winRate: player.win_rate,
        vpip: player.vpip,
        aggressionFactor: player.aggression_factor,
        showdownPercentage: player.showdown_percentage,
        showdownWinRate: player.showdown_win_rate
      },
      style: {
        coordinates: player.style_coordinates,
        description: player.style
      },
      foldingPattern: player.folded_by_street
    }))
  };

  // Create and trigger download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 