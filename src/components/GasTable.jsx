/**
 * @fileoverview GasTable Component - Displays Ethereum transaction costs in a sortable table format.
 * Shows estimated costs for different transaction types under various gas price scenarios (low, average, high).
 * Includes interactive sorting functionality for all columns.
 */

import React from 'react';
import './css/GasTable.css';

/**
 * GasTable Component - Renders a sortable table of Ethereum transaction costs
 * @param {Object[]} transactionData - Array of transaction objects with action and gasLimit properties
 * @param {Object} gasData - Current gas prices containing low, avg, and high price data
 * @param {number} ethPrice - Current ETH price in USD
 * @param {Function} onSort - Callback function for handling column sorting
 * @param {Object} sortConfig - Current sort configuration with key and direction
 * @returns {JSX.Element} A table displaying transaction costs with sortable columns
 */

let GasTable = ({ transactionData, gasData, ethPrice, onSort, sortConfig }) => {
  let getClassNamesFor = (name) => {
    if (!sortConfig) {
      return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  let calculateCost = (gasLimit, gasPrice) => {
    if (!gasData || !ethPrice) return "N/A";
    
    let gasPriceEth = gasPrice * 1e-9;
    let costEth = gasLimit * gasPriceEth;
    let costUsd = costEth * ethPrice;
    
    return `$${costUsd.toFixed(2)}`;
  };

  return (
    <table className="gas-table">
      <thead>
        <tr>
          <th className="align-left" onClick={() => onSort('action')}>
            Action
            <span className={`sort-indicator ${getClassNamesFor('action')}`}></span>
          </th>
          <th className="align-left" onClick={() => onSort('gasLimit')}>
            Gas Limit
            <span className={`sort-indicator ${getClassNamesFor('gasLimit')}`}></span>
          </th>
          <th className="align-left" onClick={() => onSort('low')}>
            Low Cost
            <span className={`sort-indicator ${getClassNamesFor('low')}`}></span>
          </th>
          <th className="align-left" onClick={() => onSort('avg')}>
            Average Cost
            <span className={`sort-indicator ${getClassNamesFor('avg')}`}></span>
          </th>
          <th className="align-left" onClick={() => onSort('high')}>
            High Cost
            <span className={`sort-indicator ${getClassNamesFor('high')}`}></span>
          </th>
        </tr>
      </thead>
      <tbody>
        {transactionData.map((transaction, index) => (
          <tr key={index}>
            <td className="align-left">{transaction.action}</td>
            <td className="monospace align-left">{transaction.gasLimit.toLocaleString()}</td>
            <td className="cost cost-low align-left">
              {calculateCost(transaction.gasLimit, gasData?.low?.price)}
            </td>
            <td className="cost cost-avg align-left">
              {calculateCost(transaction.gasLimit, gasData?.avg?.price)}
            </td>
            <td className="cost cost-high align-left">
              {calculateCost(transaction.gasLimit, gasData?.high?.price)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default GasTable;
