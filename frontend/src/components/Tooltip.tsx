import React from 'react';

interface TooltipProps {
  text: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  return (
    <div className="tooltip-container">
      <span className="tooltip-icon">?</span>
      <span className="tooltip-text">{text}</span>
    </div>
  );
}; 