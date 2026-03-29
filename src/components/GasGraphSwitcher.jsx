/**
 * @fileoverview Gas graph: on-chain history via eth_feeHistory (JSON-RPC) + live points from parent.
 */

import React, { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import {
  loadOneHourHistory,
  loadTwentyFourHourHistory,
  pointsToChart,
} from "../lib/gasFeeHistory.js";
import "./css/GasGraphSwitcher.css";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

let trimByAge = (pts, now, windowMs) => {
  let minT = now - windowMs;
  return pts.filter((p) => p.t >= minT);
};

let GasGraphSwitcher = ({ nextUpdateIn, gasData, gasFetchNonce }) => {
  let [oneHourPts, setOneHourPts] = useState([]);
  let [twentyFourHourPts, setTwentyFourHourPts] = useState([]);
  /** True once 1h history is in — enables live updates while 24h still loads. */
  let [historyReady, setHistoryReady] = useState(false);
  let [activeGraph, setActiveGraph] = useState("1hour");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let h1 = await loadOneHourHistory();
        if (cancelled) return;
        setOneHourPts(h1);
        setHistoryReady(true);

        let h24 = await loadTwentyFourHourHistory();
        if (cancelled) return;
        setTwentyFourHourPts(h24);
      } catch (e) {
        console.error("Gas history load failed:", e);
        if (!cancelled) setHistoryReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!historyReady || !gasData || !gasFetchNonce) {
      return;
    }
    let lowPrice = gasData.low.price;
    let avgPrice = gasData.avg.price;
    let highPrice = gasData.high.price;
    if (
      !Number.isFinite(lowPrice) ||
      !Number.isFinite(avgPrice) ||
      !Number.isFinite(highPrice)
    ) {
      return;
    }
    let t = Date.now();
    let sample = { t, low: lowPrice, avg: avgPrice, high: highPrice };
    setOneHourPts((p) => trimByAge([...p, sample], t, 60 * 60 * 1000));
    setTwentyFourHourPts((p) => trimByAge([...p, sample], t, 24 * 60 * 60 * 1000));
  }, [historyReady, gasFetchNonce, gasData]);

  let oneHourChart = useMemo(() => pointsToChart(oneHourPts), [oneHourPts]);
  let twentyFourChart = useMemo(
    () => pointsToChart(twentyFourHourPts),
    [twentyFourHourPts]
  );

  let commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: 12,
        },
        titleFont: {
          family: "'Space Grotesk', sans-serif",
          size: 14,
          weight: "bold",
        },
      },
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#FFFFFF",
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 12,
            weight: "500",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
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
          color: "#FFFFFF",
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 14,
            weight: "bold",
          },
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "'JetBrains Mono', monospace",
            size: 12,
          },
          callback: function (value) {
            let x = Number(value);
            if (!Number.isFinite(x)) return "";
            if (Math.abs(x) < 1) return x.toFixed(3) + " Gwei";
            if (Math.abs(x) < 10) return x.toFixed(2) + " Gwei";
            return x.toLocaleString(undefined, { maximumFractionDigits: 1 }) + " Gwei";
          },
        },
        title: {
          display: true,
          text: "Gas Price (Gwei)",
          color: "#FFFFFF",
          font: {
            family: "'Space Grotesk', sans-serif",
            size: 14,
            weight: "bold",
          },
        },
        suggestedMin: function (context) {
          let values = context.chart.data.datasets.flatMap((d) => d.data);
          let min = Math.min(...values);
          return Math.max(0, min - min * 0.15);
        },
        suggestedMax: function (context) {
          let values = context.chart.data.datasets.flatMap((d) => d.data);
          let max = Math.max(...values);
          return max + max * 0.15;
        },
        grace: "10%",
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
      easing: "easeInOutQuart",
    },
  };

  let getDatasetStyle = (g) => [
    {
      label: "Low",
      data: g.low,
      borderColor: "rgba(77, 255, 145, 1)",
      backgroundColor: "rgba(77, 255, 145, 0.1)",
      pointBackgroundColor: "rgba(77, 255, 145, 1)",
      borderWidth: 2,
    },
    {
      label: "Average",
      data: g.avg,
      borderColor: "rgba(255, 249, 77, 1)",
      backgroundColor: "rgba(255, 249, 77, 0.1)",
      pointBackgroundColor: "rgba(255, 249, 77, 1)",
      borderWidth: 2,
    },
    {
      label: "High",
      data: g.high,
      borderColor: "rgba(255, 77, 77, 1)",
      backgroundColor: "rgba(255, 77, 77, 0.1)",
      pointBackgroundColor: "rgba(255, 77, 77, 1)",
      borderWidth: 2,
    },
  ];

  let activeChart = activeGraph === "1hour" ? oneHourChart : twentyFourChart;
  let data = {
    labels: activeChart.labels,
    datasets: getDatasetStyle(activeChart),
  };

  return (
    <>
      <div className="update-time" style={{ position: "absolute", top: "10px", right: "10px" }}>
        <span>Next Update: {nextUpdateIn}s</span>
      </div>
      <div className="class_1">
        <div className="class_2">
          <button
            onClick={() => setActiveGraph("1hour")}
            className={activeGraph === "1hour" ? "active" : ""}
          >
            Last 1 Hour
          </button>
          <button
            onClick={() => setActiveGraph("24hour")}
            className={activeGraph === "24hour" ? "active" : ""}
          >
            Last 24 Hours
          </button>
        </div>
        <div style={{ width: "100%", height: "400px", margin: "0 auto" }}>
          <Line data={data} options={commonOptions} />
        </div>
      </div>
    </>
  );
};

export default GasGraphSwitcher;
