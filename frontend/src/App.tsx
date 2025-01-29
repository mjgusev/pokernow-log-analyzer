import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { PlayerCard } from './components/PlayerCard';
import { Charts } from './components/Charts';
import { SessionSummary } from './components/SessionSummary';
import './App.css';
import { API_ENDPOINT } from './constants/styles';

interface PokerStats {
  total_hands: number;
  hand_endings: {
    preflop: number;
    flop: number;
    turn: number;
    river: number;
  };
  players: {
    [key: string]: {
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
      showdown_percentage: number;
      showdown_win_rate: number;
      aggression_factor: number;
    };
  };
}

function App() {
  const [stats, setStats] = useState<PokerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (logFile: File, ledgerFile: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('log_file', logFile);
    formData.append('ledger_file', ledgerFile);

    try {
      const response = await fetch(`${API_ENDPOINT}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }

      setStats(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Poker Now Log Analyzer</h1>
      </header>

      <FileUpload onUpload={handleFileUpload} />

      {loading && (
        <div className="loading">
          Analyzing poker session...
        </div>
      )}

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {stats && (
        <>
          <SessionSummary 
            players={stats.players} 
            totalHands={stats.total_hands} 
          />
          <Charts stats={stats} />
          <div className="player-grid">
            {Object.entries(stats.players)
              .sort(([, a], [, b]) => b.net_profit - a.net_profit)
              .map(([id, playerStats]) => (
                <PlayerCard key={id} stats={playerStats} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;