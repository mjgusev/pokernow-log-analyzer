import React from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartProps {
  stats: {
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
        net_profit: number;
        vpip: number;
      };
    };
  };
}

export const Charts: React.FC<ChartProps> = ({ stats }) => {
  const profitChartData = {
    labels: Object.values(stats.players).map(p => p.name),
    datasets: [{
      label: 'Net Profit ($)',
      data: Object.values(stats.players).map(p => p.net_profit),
      backgroundColor: Object.values(stats.players).map(p => 
        p.net_profit >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'
      ),
      borderColor: Object.values(stats.players).map(p => 
        p.net_profit >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
      ),
      borderWidth: 1,
      borderRadius: 5,
      barThickness: 30
    }]
  };

  const vpipChartData = {
    labels: Object.values(stats.players).map(p => p.name),
    datasets: [{
      label: 'VPIP %',
      data: Object.values(stats.players).map(p => p.vpip),
      backgroundColor: 'rgba(54, 162, 235, 0.7)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1,
      borderRadius: 5,
      barThickness: 30
    }]
  };

  const handEndingsData = {
    labels: ['Preflop', 'Flop', 'Turn', 'River'],
    datasets: [{
      data: [
        stats.hand_endings.preflop,
        stats.hand_endings.flop,
        stats.hand_endings.turn,
        stats.hand_endings.river
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 10,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      title: {
        display: true,
        padding: {
          bottom: 15
        },
        font: {
          size: 14,
          family: "'Inter', sans-serif",
          weight: '600'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 5,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      }
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart'
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    }
  };

  const vpipOptions = {
    ...options,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          callback: (value: number) => `${value}%`
        }
      }
    },
    plugins: {
      ...options.plugins,
      tooltip: {
        callbacks: {
          label: (context: any) => `VPIP: ${context.raw.toFixed(1)}%`
        }
      }
    }
  };

  const profitOptions = {
    ...options,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          callback: (value: number) => `$${value.toFixed(0)}`
        }
      }
    },
    plugins: {
      ...options.plugins,
      tooltip: {
        callbacks: {
          label: (context: any) => `Profit: $${context.raw.toFixed(2)}`
        }
      }
    }
  };

  return (
    <div className="charts-grid">
      <div className="chart-container">
        <h3>Net Profit Distribution</h3>
        <Bar data={profitChartData} options={profitOptions} />
      </div>
      
      <div className="chart-container">
        <h3>VPIP Comparison</h3>
        <Bar data={vpipChartData} options={vpipOptions} />
      </div>
      
      <div className="chart-container">
        <h3>Hand Endings by Street</h3>
        <Pie data={handEndingsData} options={pieOptions} />
      </div>
    </div>
  );
};