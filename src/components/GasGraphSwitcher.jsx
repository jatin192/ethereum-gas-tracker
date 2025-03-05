/**
 * @fileoverview GasGraphSwitcher Component
 * Interactive graph component displaying Ethereum gas price trends over time
 * Supports 1-hour and 24-hour views with real-time updates
 */

import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import './css/GasGraphSwitcher.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

/**
 * GasGraphSwitcher Component
 * 
 * Renders interactive line graphs showing gas price trends:
 * - 1-hour view: Updates every 10 seconds
 * - 24-hour view: Updates every 10 minutes with averaged data
 * Includes real-time data fetching and automatic updates
 * 
 * @param {Object} props
 * @param {number} props.nextUpdateIn - Seconds until next data update
 * @returns {React.JSX.Element} Interactive gas price trend graphs with switching capability
 */

let GasGraphSwitcher = ({nextUpdateIn}) => {
  let [oneHourGraphData, set_Graph_1] = useState({ labels: [], low: [], avg: [], high: [] });
  let [twentyFourHourGraphData, setTwentyFourHourGraphData] = useState({ labels: [], low: [], avg: [], high: [] });
  let [minuteData, setMinuteData] = useState({ low: [], avg: [], high: [] });
  let [fiveMinuteSum, setFiveMinuteSum] = useState({ low: 0, avg: 0, high: 0, count: 0 });
  let [activeGraph, setActiveGraph] = useState('1hour');
  let [nextUpdate1Hour, setNextUpdate1Hour] = useState(10);
  let [nextUpdate24Hour, setNextUpdate24Hour] = useState(600);
  let [initialLoad, setInitialLoad] = useState(true);
  
  let API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

  /**
   * Fetches current gas prices from Etherscan API and updates graph data
   * Handles both 1-hour and 24-hour data updates
   */
  let fetchGasData = async () => {
    try {
      let response = await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`
      );
      let gasResult = response.data.result;

      let lowPrice = parseFloat(gasResult.SafeGasPrice);
      let avgPrice = parseFloat(gasResult.ProposeGasPrice);
      let highPrice = parseFloat(gasResult.FastGasPrice);
      let currentTime = new Date().toLocaleTimeString("en-GB", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      });

      if (lowPrice && avgPrice && highPrice) {
        // Update 1-hour graph data
        set_Graph_1(prevData => ({
          labels: [...prevData.labels, currentTime].slice(-360),
          low: [...prevData.low, lowPrice].slice(-360),
          avg: [...prevData.avg, avgPrice].slice(-360),
          high: [...prevData.high, highPrice].slice(-360),
        }));

        // Initial 24-hour data setup
        if (initialLoad) {
          setInitialLoad(false);
          setTwentyFourHourGraphData(prevData => ({
            labels: [...prevData.labels, currentTime].slice(-24),
            low: [...prevData.low, lowPrice].slice(-24),
            avg: [...prevData.avg, avgPrice].slice(-24),
            high: [...prevData.high, highPrice].slice(-24),
          }));
        }

        // Update minute data for averaging
        setMinuteData(prevData => ({
          low: [...prevData.low, lowPrice],
          avg: [...prevData.avg, avgPrice],
          high: [...prevData.high, highPrice],
        }));
      }
    } catch (error) {
      console.error("Error fetching gas data:", error);
      set_Graph_1(prevData => ({
        ...prevData,
        labels: [...prevData.labels, "N/A"].slice(-60),
        low: [...prevData.low, prevData.low.at(-1)].slice(-60),
        avg: [...prevData.avg, prevData.avg.at(-1)].slice(-60),
        high: [...prevData.high, prevData.high.at(-1)].slice(-60),
      }));
    }
  };

  useEffect(() => {
    let interval = setInterval(() => {
      setNextUpdate1Hour(prev => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    if (nextUpdate1Hour === 0) fetchGasData();

    return () => clearInterval(interval);
  }, [nextUpdate1Hour]);

  useEffect(() => {
    let interval = setInterval(() => {
      setNextUpdate24Hour(prev => (prev > 0 ? prev - 1 : 600));
    }, 1000);

    if (nextUpdate24Hour === 0) fetchGasData();

    return () => clearInterval(interval);
  }, [nextUpdate24Hour]);

  useEffect(() => {
    let minuteInterval = setInterval(() => {
      setMinuteData(prevData => {
        if (prevData.low.length > 0) {
          let avgLow = prevData.low.reduce((sum, val) => sum + val, 0) / prevData.low.length;
          let avgAvg = prevData.avg.reduce((sum, val) => sum + val, 0) / prevData.avg.length;
          let avgHigh = prevData.high.reduce((sum, val) => sum + val, 0) / prevData.high.length;

          setFiveMinuteSum(prevSum => ({
            low: prevSum.low + avgLow,
            avg: prevSum.avg + avgAvg,
            high: prevSum.high + avgHigh,
            count: prevSum.count + 1,
          }));

          return { low: [], avg: [], high: [] };
        }
        return prevData;
      });
    }, 60000); // Every 1 minute

    return () => clearInterval(minuteInterval);
  }, []);

  useEffect(() => {
    let fiveMinuteInterval = setInterval(() => {
      setFiveMinuteSum(prevSum => {
        if (prevSum.count > 0) {
          let avgLow = prevSum.low / prevSum.count;
          let avgAvg = prevSum.avg / prevSum.count;
          let avgHigh = prevSum.high / prevSum.count;

          let currentTime = new Date().toLocaleTimeString("en-GB", { 
            hour: "2-digit", 
            minute: "2-digit", 
            second: "2-digit" 
          });

          setTwentyFourHourGraphData(prevData => ({
            labels: [...prevData.labels, currentTime].slice(-148),
            low: [...prevData.low, avgLow].slice(-148),
            avg: [...prevData.avg, avgAvg].slice(-148),
            high: [...prevData.high, avgHigh].slice(-148),
          }));

          return { low: 0, avg: 0, high: 0, count: 0 };
        }
        return prevSum;
      });
    }, 600000); // Every 1 hour

    return () => clearInterval(fiveMinuteInterval);
  }, []);

  useEffect(() => {
    fetchGasData();
    let fetchInterval = setInterval(fetchGasData, 10000);
    return () => clearInterval(fetchInterval);
  }, []);

  let commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: 12,
        },
        titleFont: {
          family: "'Space Grotesk', sans-serif",
          size: 14,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#FFFFFF',
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 12,
            weight: '500',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          display: false,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 24,
        },
        title: {
          display: true,
          color: '#FFFFFF',
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 14,
            weight: 'bold',
          },
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 12,
          },
          callback: function(value) {
            return Math.round(value) + ' Gwei';
          },
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Gas Price (Gwei)',
          color: '#FFFFFF',
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 14,
            weight: 'bold',
          },
        },
        suggestedMin: function(context) {
          let values = context.chart.data.datasets.flatMap(d => d.data);
          let min = Math.min(...values);
          return Math.max(0, min - (min * 0.2));
        },
        suggestedMax: function(context) {
          let values = context.chart.data.datasets.flatMap(d => d.data);
          let max = Math.max(...values);
          return max + (max * 0.2);
        },
        grace: '10%',
      },
    },
    elements: {
      line: {
        tension: 0.4,
        spanGaps: true,
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };

  let getDatasetStyle = () => [
    {
      label: 'Low',
      data: activeGraph === '1hour' ? oneHourGraphData.low : twentyFourHourGraphData.low,
      borderColor: 'rgba(77, 255, 145, 1)',
      backgroundColor: 'rgba(77, 255, 145, 0.1)',
      pointBackgroundColor: 'rgba(77, 255, 145, 1)',
      borderWidth: 2,
    },
    {
      label: 'Average',
      data: activeGraph === '1hour' ? oneHourGraphData.avg : twentyFourHourGraphData.avg,
      borderColor: 'rgba(255, 249, 77, 1)',
      backgroundColor: 'rgba(255, 249, 77, 0.1)',
      pointBackgroundColor: 'rgba(255, 249, 77, 1)',
      borderWidth: 2,
    },
    {
      label: 'High',
      data: activeGraph === '1hour' ? oneHourGraphData.high : twentyFourHourGraphData.high,
      borderColor: 'rgba(255, 77, 77, 1)',
      backgroundColor: 'rgba(255, 77, 77, 0.1)',
      pointBackgroundColor: 'rgba(255, 77, 77, 1)',
      borderWidth: 2,
    },
  ];

  let data = {
    labels: activeGraph === '1hour' ? oneHourGraphData.labels : twentyFourHourGraphData.labels,
    datasets: getDatasetStyle(),
  };

  return (
    <>
      <div className="update-time" style={{ position: 'absolute', top: '10px', right: '10px' }}>
        {activeGraph === '1hour' ? <span>Next Update: {nextUpdate1Hour}s</span> 
          : <span>Next Update: {nextUpdate24Hour}s</span>}
      </div>
      <div className="class_1">
        <div className="class_2">
          <button 
            onClick={() => setActiveGraph('1hour')}
            className={activeGraph === '1hour' ? 'active' : ''}
          >
            Last 1 Hour
          </button>
          <button 
            onClick={() => setActiveGraph('24hour')}
            className={activeGraph === '24hour' ? 'active' : ''}
          >
            Last 24 Hours
          </button>
        </div>
        <div style={{ width: '100%', height: '400px', margin: '0 auto' }}>
          <Line data={data} options={commonOptions} />
        </div>
      </div>
    </>
  );
};

export default GasGraphSwitcher;