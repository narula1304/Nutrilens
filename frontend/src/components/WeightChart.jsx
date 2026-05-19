import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale, // Import TimeScale for date axes
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the adapter

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

export default function WeightChart({ weightData }) {
  // Basic chart options (customize as needed)
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container height
    plugins: {
      legend: {
        display: false, // Hide legend for a simple chart
      },
      title: {
        display: false, // Hide title
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        type: 'time', // Use time scale for the x-axis
        time: {
            unit: 'day', // Display units as days
             tooltipFormat: 'MMM d, yyyy', // Format for tooltip
             displayFormats: {
                 day: 'MMM d' // Format for axis labels
             }
        },
        title: {
          display: false,
        },
        grid: {
           display: false, // Hide x-axis grid lines
        },
         ticks: {
             maxTicksLimit: 7, // Limit number of date labels shown
         }
      },
      y: {
        title: {
          display: false,
        },
         beginAtZero: false, // Don't force y-axis to start at 0
         grid: {
            color: 'rgba(200, 200, 200, 0.2)', // Lighter grid lines
         },
         ticks: {
            // Include unit in y-axis labels
            callback: function(value) {
                return value + ' kg';
            }
         }
      },
    },
     elements: {
        line: {
            tension: 0.3, // Slightly curve the line
        }
     }
  };

  // Prepare data for the chart
  const data = {
    // Labels will be dates (or timestamps)
    // Use ISO date strings or Date objects for the time scale
    labels: weightData.map(entry => entry.date),
    datasets: [
      {
        label: 'Weight (kg)',
        // Data points are weights
        data: weightData.map(entry => entry.weight),
        borderColor: '#22c55e', // Primary color line
        backgroundColor: 'rgba(34, 197, 94, 0.2)', // Slight fill under line
        fill: true,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#16a34a', // Primary dark on hover
      },
    ],
  };

  return (
      <div className="h-48 w-full pt-4"> {/* Container with defined height */}
          {weightData.length > 0 ? (
              <Line options={options} data={data} />
          ) : (
              <div className="flex items-center justify-center h-full text-muted-light dark:text-muted-dark">
                  No weight data logged yet.
              </div>
          )}
      </div>
  );
}