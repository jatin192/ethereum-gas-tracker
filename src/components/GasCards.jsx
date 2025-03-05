/**
 * @fileoverview GasCards Component
 * Displays real-time Ethereum gas prices in a card-based layout
 */

import React from "react";
import "./css/GasCards.css";

/**
 * GasCards Component
 * 
 * Renders three cards showing LOW, AVG, and HIGH gas prices with
 * their respective base fees, priority fees, and time estimates.
 * Also displays last block and next update information.
 * 
 * @param {Object} props
 * @param {Object} props.gasData - Object containing gas price data for LOW, AVG, HIGH categories
 * @param {number} props.nextUpdateIn - Seconds until next data update
 * @param {string} props.lastBlock - Latest Ethereum block number
 * @returns {React.JSX.Element} Cards displaying gas prices and status
 */

let GasCards = ({ gasData, nextUpdateIn, lastBlock }) => (
  <div className="gas-tracker-container">
    <div className="status-updates">
      <div className="last-block">Last Block: {lastBlock}</div>
      <div className="next-update">Next Update: {nextUpdateIn}s</div>
    </div>
    <div className="card-container">
      {Object.entries(gasData).map(([key, data]) => (
        <div key={key} className={`card ${key.toLowerCase()}-card`}>
          <div className="card-header">
            {key.toUpperCase() === "LOW" && <p className="status low">😁 LOW</p>}
            {key.toUpperCase() === "AVG" && <p className="status avg">😃 AVG</p>}
            {key.toUpperCase() === "HIGH" && <p className="status high"> 🙂 HIGH</p>}
          </div>
          
          <div className="card-price">
            {key.toUpperCase() === "LOW" && <h3 className="price low">{data.price.toFixed(3)} gwei</h3>}
            {key.toUpperCase() === "AVG" && <h3 className="price avg">{data.price.toFixed(3)} gwei</h3>}
            {key.toUpperCase() === "HIGH" && <h3 className="price high">{data.price.toFixed(3)} gwei</h3>}
          </div>

          <div className="card-details">
            <p className="fee-line">Base: {data.base.toFixed(3)} Gwei  Priority: {data.priority.toFixed(3)} Gwei</p>
          </div>

          <div className="card-footer">
            <p className="estimate">${data.cost} | {data.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default GasCards;
