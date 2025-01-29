import React, { useState, useCallback, useMemo } from 'react';
import { formatDuration } from '../utils/formatters';
import { exportSessionData } from '../utils/exportData';

interface Player {
  name: string;
  net_profit: number;
  hands_played: number;
  win_rate: number;
  showdown_win_rate?: number;
  vpip: number;
  aggression_factor: number;
}

interface SessionSummaryProps {
  players: { [key: string]: Player };
  totalHands: number;
  sessionDuration?: number;  // in minutes
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ players, totalHands, sessionDuration }) => {
  const [sortBy, setSortBy] = useState<'profit' | 'hands' | 'winrate'>('profit');
  
  const getSortedPlayers = useCallback(() => {
    return Object.values(players).sort((a, b) => {
      switch (sortBy) {
        case 'profit': return b.net_profit - a.net_profit;
        case 'hands': return b.hands_played - a.hands_played;
        case 'winrate': return b.win_rate - a.win_rate;
        default: return 0;
      }
    });
  }, [players, sortBy]);

  const sortedPlayers = useMemo(() => getSortedPlayers(), [getSortedPlayers]);
  const totalMoney = sortedPlayers.reduce((sum, p) => sum + Math.abs(p.net_profit), 0);
  const biggestWin = Math.max(...sortedPlayers.map(p => p.net_profit));
  const biggestLoss = Math.min(...sortedPlayers.map(p => p.net_profit));
  const handsPerHour = sessionDuration ? (totalHands / (sessionDuration / 60)).toFixed(0) : 'N/A';

  return (
    <div className="session-summary">
      <div className="summary-header">
        <div className="summary-stats">
          <div className="stat-pill">
            <span>🎲 {totalHands} hands</span>
            {sessionDuration && <span>• {handsPerHour} hands/hr</span>}
          </div>
          <div className="stat-pill">
            <span>💰 ${(totalMoney / 2).toFixed(2)} in play</span>
          </div>
          {sessionDuration && (
            <div className="stat-pill">
              <span>⏱️ {formatDuration(sessionDuration)}</span>
            </div>
          )}
        </div>
        <div className="summary-controls">
          <div className="sort-controls">
            <span>Sort by:</span>
            <div className="sort-buttons">
              <button 
                className={sortBy === 'profit' ? 'active' : ''} 
                onClick={() => setSortBy('profit')}
              >
                Profit
              </button>
              <button 
                className={sortBy === 'hands' ? 'active' : ''} 
                onClick={() => setSortBy('hands')}
              >
                Hands
              </button>
              <button 
                className={sortBy === 'winrate' ? 'active' : ''} 
                onClick={() => setSortBy('winrate')}
              >
                Win Rate
              </button>
            </div>
          </div>
          <button 
            className="export-button"
            onClick={() => exportSessionData({ total_hands: totalHands, players })}
          >
            📊 Export Results
          </button>
        </div>
      </div>

      <div className="players-results">
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.name}
            className={`player-result ${player.net_profit > 0 ? 'winner' : 'loser'}`}
            style={{
              '--animation-delay': `${index * 100}ms`,
              '--profit-percentage': `${(player.net_profit / (biggestWin || 1)) * 100}%`,
              '--loss-percentage': `${(player.net_profit / (biggestLoss || -1)) * 100}%`
            } as React.CSSProperties}
          >
            <div className="player-info">
              <span className="player-name">{player.name}</span>
              <div className="player-metrics">
                <span>{player.hands_played}h</span>
                <span>{(player.win_rate * 100).toFixed(1)}%w</span>
                <span>{player.vpip.toFixed(0)}%v</span>
                <span>{player.aggression_factor?.toFixed(1)}af</span>
              </div>
            </div>
            <div className="profit-bar-container">
              <div className="profit-bar">
                <div className="profit-indicator" />
              </div>
              <span className={`profit-amount ${player.net_profit >= 0 ? 'positive' : 'negative'}`}>
                {player.net_profit >= 0 ? '+' : '-'}${Math.abs(player.net_profit).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 