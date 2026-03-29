import axios from "axios";

export let API_KEY = String(import.meta.env.VITE_ETHERSCAN_API_KEY ?? "").trim();

/** Ethereum mainnet — Etherscan API V2 (V1 deprecated). */
export let ETHERSCAN_V2 = (query) =>
  `https://api.etherscan.io/v2/api?chainid=1&${query}&apikey=${API_KEY}`;

let lastEtherscanRequestStart = 0;
let ETHERSCAN_MIN_INTERVAL_MS = 500;
let etherscanQueueTail = Promise.resolve();

/**
 * Serializes Etherscan HTTP GETs and spaces them to stay under free-tier rate limits.
 */
export let etherscanGet = (url) => {
  let run = etherscanQueueTail.then(async () => {
    let now = Date.now();
    let wait = Math.max(0, ETHERSCAN_MIN_INTERVAL_MS - (now - lastEtherscanRequestStart));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastEtherscanRequestStart = Date.now();
    return axios.get(url);
  });
  etherscanQueueTail = run.catch(() => {});
  return run;
};
