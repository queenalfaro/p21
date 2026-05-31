import HeartbeatWorker from "@/shared/lib/workers/heartbeat.worker?worker"
import { signalState } from "../lib/signal-state"

export function startHeartbeatCollector(): () => void {
    const worker = new HeartbeatWorker()
    function onMessage(e: MessageEvent<{ type: string; ts: number }>) {
        if (e.data?.type === "tick") {
            signalState.lastWorkerTickAt = Date.now()
        }
    }
    worker.addEventListener("message", onMessage)
    return () => {
        worker.removeEventListener("message", onMessage)
        worker.terminate()
    }
}
