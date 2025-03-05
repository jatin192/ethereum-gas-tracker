/**
 * @fileoverview Main application component for the Ethereum Gas Tracker.
 * Provides real-time gas price monitoring, transaction cost estimation,
 * and historical gas price visualization through graphs and tables.
 * Integrates with Etherscan API for live data updates every 10 seconds.
 */

import React, { useState, useEffect } from 'react';
import axios from "axios";
import GasCards from "./components/GasCards";
import GasTable from "./components/GasTable";
import GasGraphSwitcher from './components/GasGraphSwitcher'
import Footer from "./components/Footer";
import "./App.css";
import { Chart as ChartJS,LineElement,CategoryScale,LinearScale,PointElement,Tooltip,Legend} from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

let API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

/**
 * Main App component that orchestrates the Ethereum Gas Tracker application
 * Manages gas prices, ETH price, transaction data, and UI state
 * @returns {JSX.Element} The complete application UI
 */
function App() 
{
  // State management for gas tracking and UI
  let [selectedGraph, setSelectedGraph] = useState("1hour");
  let [gasData, setGasData] = useState(null);
  let [ethPrice, setEthPrice] = useState(0);
  let [lastBlock, setLastBlock] = useState(null);
  let [loading, setLoading] = useState(true);
  let [error, setError] = useState(null);
  let [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  let [blockTime, setBlockTime] = useState(13);
  let [sortConfig, setSortConfig] = useState({ key: "gasLimit", direction: "asc" });
  let [showHourlyGraph, setShowHourlyGraph] = useState(false);
  
  // Pagination state
  let [currentPage, setCurrentPage] = useState(1);
  let [rowsPerPage, setRowsPerPage] = useState(10);
  
  // New state variables for refresh time
  let [lastRefreshed, setLastRefreshed] = useState('');
  let [nextUpdateIn, setNextUpdateIn] = useState(10);
  let [basefee_i, set_basefee] = useState('');
  let [transactionData, setTransactionData] = useState([
    { action: "OpenSea: Sale", gasLimit: 71645 },
    { action: "Uniswap V3: Swap", gasLimit: 184523 },
    { action: "USDT: Transfer", gasLimit: 54128 },
    { action: "SushiSwap: Swap", gasLimit: 141225 },
    { action: "Curve: Swap", gasLimit: 183758 },
    { action: "Balancer: Swap", gasLimit: 196625 },
    { action: "Bancor: Swap", gasLimit: 183193 },
    { action: "1inch: Swap", gasLimit: 141905 },
    { action: "KyberSwap: Swap", gasLimit: 144389 },
    { action: "Uniswap V2: Swap", gasLimit: 152809 },
    { action: "ERC20: Transfer", gasLimit: 65000 },
    { action: "ERC721: Transfer", gasLimit: 84904 },
    { action: "CoW Protocol: Swap", gasLimit: 343353 },
    { action: "LooksRare: Sale", gasLimit: 326897 },
    { action: "Gnosis Safe: Create Multisig", gasLimit: 288276 },
    { action: "Curve: Add Liquidity", gasLimit: 271909 },
    { action: "ENS: Register Domain", gasLimit: 266996 },
    { action: "Rarible: Sale", gasLimit: 245730 },
    { action: "Uniswap V3: Add Liquidity", gasLimit: 216912 },
    { action: "SuperRare: Sale", gasLimit: 130704 },
    { action: "SuperRare: Offer", gasLimit: 85191 },
  ]);

  /**
   * Fetches current gas prices, ETH price, and blockchain status from Etherscan
   * Updates application state with the latest data every 10 seconds
   * @async
   */
  let fetchGasData = async () => 
    {
    try {
      let gasResponse = await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${API_KEY}`
      );
      let priceResponse = await axios.get(
        `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${API_KEY}`
      );

      let statusResponse = await axios.get(
        `https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${API_KEY}`
      );

      let gasDataResult = gasResponse.data.result;
      let ethPriceInUsd = parseFloat(priceResponse.data.result.ethusd);
      let basePrice = parseFloat(gasDataResult.suggestBaseFee);
      let lowPrice = parseFloat(gasDataResult.SafeGasPrice);
      let avgPrice = parseFloat(gasDataResult.ProposeGasPrice);
      let highPrice = parseFloat(gasDataResult.FastGasPrice);

      set_basefee(basePrice);

      setGasData({
        low: {
          price: lowPrice,
          base: basePrice,
          priority: lowPrice - basePrice,
          cost: calculateCost(lowPrice, "21000", ethPriceInUsd),  
          time: calculateTime(lowPrice, "low"),
        },
        avg: {
          price: avgPrice,
          base: basePrice,
          priority: avgPrice - basePrice,
          cost: calculateCost(avgPrice, "21000", ethPriceInUsd),
          time: calculateTime(avgPrice, "avg"),
        },
        high: {
          price: highPrice,
          base: basePrice,
          priority: highPrice - basePrice,
          cost: calculateCost(highPrice, "21000", ethPriceInUsd),
          time: calculateTime(highPrice, "high"),
        },
      });

      setEthPrice(ethPriceInUsd);

      let blockNumber = parseInt(statusResponse.data.result, 16); 
      setLastBlock(blockNumber);

      setLoading(false);

      setLastRefreshed(new Date().toLocaleString());
      setNextUpdateIn(10);  // Reset to 10 seconds

    } 
    catch (error) 
    {
      setError("Error fetching gas or ETH price data");
    }
  };

  /**
   * Calculates transaction cost in USD based on gas parameters
   * @param {number} gasPrice - Current gas price in Gwei
   * @param {string} gasLimit - Gas limit for the transaction
   * @param {number} ethPriceInUsd - Current ETH price in USD
   * @returns {string} Estimated cost in USD, fixed to 2 decimal places
   */
  let calculateCost = (gasPrice, gasLimit, ethPriceInUsd) => 
  {
      let costInETH = (gasPrice * gasLimit) / 1e9;
      return (costInETH * ethPriceInUsd).toFixed(2);
  };

  /**
   * Estimates transaction confirmation time based on gas price and priority
   * @param {number} gasPrice - Gas price in Gwei
   * @param {string} type - Priority level ('low', 'avg', or 'high')
   * @returns {string} Estimated confirmation time in seconds
   */
  let calculateTime = (gasPrice, type) => 
  {
      let blocksToConfirm = type === "low" ? Math.ceil(120 / gasPrice) : type === "avg" ? Math.ceil(60 / gasPrice) : Math.ceil(30 / gasPrice);
      return `~ ${Math.ceil(blocksToConfirm * blockTime)} sec`;
  };

  /**
   * Handles sorting of transaction data in the table
   * @param {string} key - Column key to sort by
   */
  let handleSort = (key) => 
  {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") 
    {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  let sortedData = [...transactionData].sort((a, b) => 
  {
    if (sortConfig.key === "low" || sortConfig.key === "avg" || sortConfig.key === "high") {
      let aValue = gasData[sortConfig.key].price * a.gasLimit;
      let bValue = gasData[sortConfig.key].price * b.gasLimit;
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    } 
    else 
    {
      return sortConfig.direction === "asc" ? a[sortConfig.key] - b[sortConfig.key] : b[sortConfig.key] - a[sortConfig.key];
    }
  });

  let startIndex = (currentPage - 1) * rowsPerPage;
  let paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => 
  {
    fetchGasData();
    let interval = setInterval(fetchGasData, 10000);
    let countdownInterval = setInterval(() => 
    {
      setNextUpdateIn((prev) => (prev > 1 ? prev - 1 : 10));
    }, 1000);

    let timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => 
    {
        clearInterval(interval);
        clearInterval(countdownInterval);
        clearInterval(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-container glass-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Gas Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container glass-container">
        <div className="error-icon">⚠️</div>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-background">
        <div className="gradient-sphere gradient-1"></div>
        <div className="gradient-sphere gradient-2"></div>
        <div className="gradient-sphere gradient-3"></div>
      </div>
      
      <div className="app-container">
        <header className="glass-header">
          <h1>Ethereum Gas Tracker</h1>
          <div className="header-content">
            <div className="header-subtitle">
              <div className="update-info">
                <span>Last Update: {lastRefreshed}</span>
                <span className="eth-price">ETH Price: ${ethPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="network-status">
              <span className="status-dot"></span>
              <span>Mainnet</span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <section className="gas-cards-section glass-container">
            <GasCards gasData={gasData} nextUpdateIn={nextUpdateIn} lastBlock={lastBlock} />
          </section>

          <section className="gas-table-section glass-container">
            <div className="update-time" style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <span>Next Update: {nextUpdateIn}s</span>
            </div>
            <h2 className="section-title">Transaction Costs</h2>
            <div className="table-wrapper">
              <GasTable 
                transactionData={paginatedData} 
                gasData={gasData} 
                ethPrice={ethPrice} 
                onSort={handleSort} 
                sortConfig={sortConfig} 
              />
              <div className="pagination">
                <select onChange={(e) => setRowsPerPage(Number(e.target.value))} value={rowsPerPage} className="glass-select">
                  <option value={10}>10 rows</option>
                  <option value={15}>15 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={100}>100 rows</option>
                </select>
                <button className="pagination-btn" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}>
                  <span className="btn-text">Previous</span>
                </button>
                <span className="page-info">Page {currentPage} of {Math.ceil(sortedData.length / rowsPerPage)}</span>
                <button className="pagination-btn" onClick={() => setCurrentPage(Math.min(currentPage + 1, Math.ceil(sortedData.length / rowsPerPage)))}>
                  <span className="btn-text">Next</span>
                </button>
              </div>
            </div>
          </section>

          <section className="gas-graph-section glass-container">
            <h2 className="section-title"style={{ marginTop: '14px',marginLeft:'10px'}} >Gas Price Trends</h2>
            <GasGraphSwitcher nextUpdateIn ={nextUpdateIn}></GasGraphSwitcher>
          </section>
        </main>
        <Footer/>
      </div>
    </div>
  );
}

export default App;
