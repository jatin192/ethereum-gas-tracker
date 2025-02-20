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

function App() 
{
  let [selectedGraph, setSelectedGraph] = useState("1hour"); // Track the selected graph ("1hour" or "24hours")
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
          cost: calculateCost(lowPrice, "21000", ethPriceInUsd),  //gasLimit =21000
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

      let blockNumber = parseInt(statusResponse.data.result, 16); // Convert hex to decimal
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

  let calculateCost = (gasPrice, gasLimit, ethPriceInUsd) => 
  {
      let costInETH = (gasPrice * gasLimit) / 1e9;
      return (costInETH * ethPriceInUsd).toFixed(2);
  };

  let calculateTime = (gasPrice, type) => 
  {
      let blocksToConfirm = type === "low" ? Math.ceil(120 / gasPrice) : type === "avg" ? Math.ceil(60 / gasPrice) : Math.ceil(30 / gasPrice);
      return `~ ${Math.ceil(blocksToConfirm * blockTime)} sec`;
  };

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

  // Pagination logic: calculate the data to be displayed for the current page
  let startIndex = (currentPage - 1) * rowsPerPage;
  let paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => 
  {
    fetchGasData();
    let interval = setInterval(fetchGasData, 10000);
    let countdownInterval = setInterval(() => 
    {
      setNextUpdateIn((prev) => (prev > 1 ? prev - 1 : 10));  // Countdown from 10 seconds
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
      
      <header className="app-header glass-container">
        <div className="header-content">
          <h1 className="title">Ethereum Gas Tracker</h1>
          <div className="header-stats">
            <div className="stat-item">
              <span className="label">ETH Price:</span>
              <span className="value">${ethPrice.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="label">Last Block:</span>
              <span className="value">{lastBlock}</span>
            </div>
            <div className="stat-item">
              <span className="label">Base Fee:</span>
              <span className="value">{basefee_i ? parseFloat(basefee_i).toFixed(2) : 'Loading...'} gwei</span>
            </div>
            <div className="stat-item update-timer">
              <span className="label">Next Update:</span>
              <span className="value">{nextUpdateIn}s</span>
            </div>
          </div>
        </div>
        <div className="update-time">
          <span className="label">Last Updated:</span>
          <span className="value">{currentTime}</span>
          <span className="status-dot"></span>
          <span className="status-text">Mainnet</span>
        </div>
      </header>

      <main className="app-content">
        <section className="gas-cards-section glass-container">
          <GasCards gasData={gasData} />
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
      <footer className="app-footer glass-container">
        <Footer></Footer>
      </footer>
    </div>
  );
}

export default App;
