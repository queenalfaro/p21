import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"

interface UseQRScannerReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>
    error: string | null
    isReady: boolean
}

export function useQRScanner(onScan: (data: string) => void): UseQRScannerReturn {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [isReady, setIsReady] = useState(false)
    const onScanRef = useRef(onScan)
    useEffect(() => {
        onScanRef.current = onScan
    }, [onScan])

    useEffect(() => {
        let stream: MediaStream | null = null
        let rafId: number
        let done = false
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        function scan() {
            if (done || !ctx) return
            const video = videoRef.current
            if (!video || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
                rafId = requestAnimationFrame(scan)
                return
            }
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            ctx.drawImage(video, 0, 0)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code && !done) {
                done = true
                onScanRef.current(code.data)
            } else if (!done) {
                rafId = requestAnimationFrame(scan)
            }
        }

        async function start() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                })
                const video = videoRef.current
                if (!video) return
                video.srcObject = stream
                await video.play()
                setIsReady(true)
                rafId = requestAnimationFrame(scan)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Camera access denied")
            }
        }

        start()

        return () => {
            done = true
            cancelAnimationFrame(rafId)
            stream?.getTracks().forEach((t) => t.stop())
        }
    }, []) // intentional empty deps — onScan updates via ref

    return { videoRef, error, isReady }
}
