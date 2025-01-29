import React from 'react';
import { Tooltip } from './Tooltip';

interface PlayerStats {
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

interface PlayerCardProps {
  stats: {
    name: string;
    total_buyin: number;
    final_stack: number;
    net_profit: number;
    hands_played: number;
    win_rate: number;
    style_coordinates: {
      x: number;
      y: number;
    };
    folded_by_street: {
      [key: string]: number;
    };
    showdown_percentage?: number;
    showdown_win_rate?: number;
    aggression_factor?: number;
  };
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ stats }) => {
  const getStyleColor = (style: string) => {
    const styleColors: { [key: string]: string } = {
      'Very Loose': '#f43f5e',
      'Loose': '#3b82f6',
      'Regular L/T': '#8b5cf6',
      'Tight': '#10b981',
      'Very Tight': '#059669',
      'Very Passive': '#94a3b8',
      'Passive': '#64748b',
      'Regular P/A': '#6366f1',
      'Aggressive': '#ef4444',
      'Very Aggressive': '#dc2626'
    };
    return styleColors[style] || '#64748b';
  };

  const getStyleDescription = (x: number, y: number): string => {
    const loosenessFactor = Math.abs(x);
    const aggressionFactor = Math.abs(y);
    
    let style = '';
    
    if (loosenessFactor > aggressionFactor) {
      style = x > 0 ? 'Loose' : 'Tight';
      if (y > 0.3) style += '-Aggressive';
      else if (y < -0.3) style += '-Passive';
    } else {
      style = y > 0 ? 'Aggressive' : 'Passive';
      if (x > 0.3) style = 'Loose-' + style;
      else if (x < -0.3) style = 'Tight-' + style;
    }
    
    const intensity = Math.max(loosenessFactor, aggressionFactor);
    if (intensity > 0.7) style = 'Very ' + style;
    else if (intensity < 0.3) style = 'Balanced';
    
    return style;
  };

  const renderStyleBars = () => (
    <div className="style-bars">
      <div className="style-bar">
        <div className="bar-labels">
          <span>Tight</span>
          <span>Loose</span>
        </div>
        <div className="bar-track">
          <div 
            className="bar-fill"
            style={{ 
              left: '50%',
              width: `${Math.abs(stats.style_coordinates.x) * 50}%`,
              transform: `translateX(${stats.style_coordinates.x < 0 ? '-100%' : '0'})`,
            }}
          />
          <div className="bar-marker" />
        </div>
      </div>
      <div className="style-bar">
        <div className="bar-labels">
          <span>Passive</span>
          <span>Aggressive</span>
        </div>
        <div className="bar-track">
          <div 
            className="bar-fill"
            style={{ 
              left: '50%',
              width: `${Math.abs(stats.style_coordinates.y) * 50}%`,
              transform: `translateX(${stats.style_coordinates.y < 0 ? '-100%' : '0'})`,
            }}
          />
          <div className="bar-marker" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="player-card">
      <h3>{stats.name}</h3>
      
      <div className="card-section financial">
        <h4>Financial Summary</h4>
        <div className="financial-summary">
          <div className="stack-info">
            <div className="money-row">
              <span className="money-label">Buy-in:</span>
              <span className="money-value">${stats.total_buyin.toFixed(2)}</span>
            </div>
            <div className="money-row">
              <span className="money-label">Final:</span>
              <span className="money-value">${stats.final_stack.toFixed(2)}</span>
            </div>
          </div>
          <div className="profit-display">
            <span className="profit-label">Net Profit</span>
            <span className={`profit-amount ${stats.net_profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
              {stats.net_profit >= 0 ? '+$' : '-$'}{Math.abs(stats.net_profit).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="card-section style">
        <h4>Playing Style</h4>
        <span className="style-type">
          {getStyleDescription(stats.style_coordinates.x, stats.style_coordinates.y)}
        </span>
        {renderStyleBars()}
      </div>

      <div className="card-section stats">
        <h4>Performance Metrics</h4>
        <div className="stats-grid">
          <div className="stat-group">
            <div className="stat-box">
              <div className="metric-header">
                <span className="stat-label">Hands Played</span>
                <Tooltip text="Total number of hands participated in during the session" />
              </div>
              <span className="stat-value">{stats.hands_played}</span>
            </div>
            <div className="stat-box">
              <div className="metric-header">
                <span className="stat-label">Win Rate</span>
                <Tooltip text="Percentage of hands won out of total hands played" />
              </div>
              <span className="stat-value">{(stats.win_rate * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="stat-group">
            <div className="stat-box">
              <div className="metric-header">
                <span className="stat-label">Showdown %</span>
                <Tooltip text="Percentage of hands that went to showdown after seeing the flop" />
              </div>
              <span className="stat-value">{stats.showdown_percentage?.toFixed(1) ?? '0.0'}%</span>
              <span className="stat-subtitle">When seeing flop</span>
            </div>
            <div className="stat-box">
              <div className="metric-header">
                <span className="stat-label">Showdown Wins</span>
                <Tooltip text="Win rate when reaching showdown - indicates hand reading ability" />
              </div>
              <span className="stat-value">{stats.showdown_win_rate?.toFixed(1) ?? '0.0'}%</span>
              <span className="stat-subtitle">When reaching showdown</span>
            </div>
          </div>
          <div className="stat-box aggression">
            <div className="metric-header">
              <span className="stat-label">Aggression Factor</span>
              <Tooltip text="Ratio of aggressive actions (bets/raises) to passive actions (calls). Higher values indicate more aggressive play" />
            </div>
            <span className="stat-value">{stats.aggression_factor?.toFixed(1) ?? '0.0'}</span>
            <span className="stat-subtitle">Bets & Raises / Calls</span>
          </div>
        </div>
      </div>

      <div className="card-section folding">
        <h4>Folding Pattern</h4>
        <div className="fold-bars">
          {Object.entries(stats.folded_by_street).map(([street, folds]) => (
            <div key={street} className="fold-bar">
              <span className="fold-label">
                {street.charAt(0).toUpperCase() + street.slice(1)}
              </span>
              <div className="fold-bar-bg">
                <div 
                  className="fold-bar-fill"
                  style={{ 
                    width: `${(folds / stats.hands_played) * 100}%`,
                  }}
                />
              </div>
              <span className="fold-value">
                {((folds / stats.hands_played) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};