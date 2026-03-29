/**
 * Historical gas from JSON-RPC eth_feeHistory.
 * Uses a dedicated queue and prefers a reliable public RPC first so charts fill quickly
 * (user VITE_ETH_RPC_URL may be slow or cap range, e.g. Cloudflare ~10 blocks).
 */

let DEFAULT_RPC = "https://ethereum.publicnode.com";

/** Public endpoint first so 1h / 24h history is fast; optional user URL as fallback. */
let rpcUrlCandidatesForHistory = () => {
  let u = String(import.meta.env.VITE_ETH_RPC_URL ?? "").trim();
  let list = [DEFAULT_RPC];
  if (u && u !== DEFAULT_RPC) list.push(u);
  return list;
};

let BLOCK_MS = 12000;
let CHUNK_TRY_ORDER = [1024, 256, 64, 32, 10];

let weiHexToGweiNum = (hex) => {
  if (hex == null || hex === "") return NaN;
  let s = String(hex).trim();
  if (!/^0x[0-9a-f]+$/i.test(s)) return NaN;
  return Number(BigInt(s)) / 1e9;
};

/** History-only queue (does not block Etherscan calls in App.jsx). */
let historyRpcTail = Promise.resolve();
let HISTORY_RPC_GAP_MS = 50;

let postJsonRpc = async (url, method, params) => {
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  let text = await res.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    return { error: { message: "Invalid JSON from RPC" }, result: null };
  }
  if (j.error) return { error: j.error, result: null };
  return { error: null, result: j.result };
};

let rpcCallHistory = (method, params) => {
  let run = historyRpcTail.then(async () => {
    await new Promise((r) => setTimeout(r, HISTORY_RPC_GAP_MS));
    for (let url of rpcUrlCandidatesForHistory()) {
      let { error, result } = await postJsonRpc(url, method, params);
      if (result != null && !error) return result;
    }
    return null;
  });
  historyRpcTail = run.catch(() => {});
  return run;
};

let seriesFromFeeHistory = (fh, newestBlockMs) => {
  let { baseFeePerGas, reward } = fh;
  if (!Array.isArray(reward) || !Array.isArray(baseFeePerGas)) return [];
  let n = Math.min(reward.length, baseFeePerGas.length);
  let pts = [];
  for (let i = 0; i < n; i++) {
    let bf = weiHexToGweiNum(baseFeePerGas[i]);
    if (!Number.isFinite(bf)) continue;
    let rw = Array.isArray(reward[i]) ? reward[i] : [];
    let p0 = rw[0] != null ? weiHexToGweiNum(rw[0]) : 0;
    let p1 = rw[1] != null ? weiHexToGweiNum(rw[1]) : p0;
    let p2 = rw[2] != null ? weiHexToGweiNum(rw[2]) : p1;
    if (!Number.isFinite(p0)) p0 = 0;
    if (!Number.isFinite(p1)) p1 = p0;
    if (!Number.isFinite(p2)) p2 = p1;
    let t = newestBlockMs - (n - 1 - i) * BLOCK_MS;
    pts.push({
      t,
      low: bf + p0,
      avg: bf + p1,
      high: bf + p2,
    });
  }
  return pts;
};

let feeHistoryOnce = async (blockCount, newestBlock) => {
  let hexCount = "0x" + Number(blockCount).toString(16);
  return rpcCallHistory("eth_feeHistory", [hexCount, newestBlock, [25, 50, 75]]);
};

let fetchFeeHistoryWindow = async (targetBlocks, newestBlock = "latest") => {
  let merged = [];
  let newestBlockParam = newestBlock;
  let newestBlockMs = Date.now();
  let gathered = 0;
  let guard = 0;
  let maxIterations = Math.ceil(targetBlocks / 10) + 150;
  let chunkIndex = 0;

  while (gathered < targetBlocks && guard < maxIterations) {
    guard++;
    let chunk = CHUNK_TRY_ORDER[chunkIndex] ?? 10;
    let r = await feeHistoryOnce(chunk, newestBlockParam);
    if (!r?.reward?.length) {
      chunkIndex++;
      if (chunkIndex >= CHUNK_TRY_ORDER.length) break;
      continue;
    }
    chunkIndex = 0;
    let pts = seriesFromFeeHistory(r, newestBlockMs);
    if (!pts.length) break;
    merged = pts.concat(merged);
    gathered += pts.length;
    let ob = r.oldestBlock;
    if (ob == null) break;
    let obn = BigInt(ob);
    if (obn <= 1n) break;
    newestBlockParam = "0x" + (obn - 1n).toString(16);
    newestBlockMs = merged[0].t - BLOCK_MS;
  }

  merged.sort((a, b) => a.t - b.t);
  if (merged.length > targetBlocks) {
    merged = merged.slice(-targetBlocks);
  }
  return merged;
};

/**
 * ~1 hour of blocks — few RPC calls when 1024 chunk works.
 */
export let loadOneHourHistory = () => fetchFeeHistoryWindow(300, "latest");

/**
 * ~24 hours, downsampled. Same chain walk as before but runs after 1h in the UI.
 */
export let loadTwentyFourHourHistory = async () => {
  let approxBlocks = Math.ceil((24 * 60 * 60 * 1000) / BLOCK_MS);
  let merged = await fetchFeeHistoryWindow(approxBlocks, "latest");
  let cutoff = Date.now() - 24 * 60 * 60 * 1000;
  merged = merged.filter((p) => p.t >= cutoff);
  return downsamplePoints(merged, 220);
};

let downsamplePoints = (pts, maxLen) => {
  if (pts.length <= maxLen) return pts;
  let step = pts.length / maxLen;
  let out = [];
  for (let i = 0; i < maxLen; i++) {
    let j = Math.min(pts.length - 1, Math.floor(i * step));
    out.push(pts[j]);
  }
  return out;
};

let formatTimeLabel = (t) =>
  new Date(t).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export let pointsToChart = (pts) => ({
  labels: pts.map((p) => formatTimeLabel(p.t)),
  low: pts.map((p) => p.low),
  avg: pts.map((p) => p.avg),
  high: pts.map((p) => p.high),
});
