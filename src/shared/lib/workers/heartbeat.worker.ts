// Web Worker: ticks every 2 s independent of the main thread
// msSinceWorkerTick in SignalSnapshot measures time since last tick →
// if dead for ≥30 s, the browser has frozen the page (screen off)
const INTERVAL_MS = 2_000

setInterval(() => {
    postMessage({ type: "tick", ts: Date.now() })
}, INTERVAL_MS)
