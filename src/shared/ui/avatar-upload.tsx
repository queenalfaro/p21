import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon } from "@hugeicons/core-free-icons"
import { uploadAvatar } from "@/shared/lib/upload-avatar"
import { cn } from "@/shared/lib/cn"

interface AvatarUploadProps {
    /** Current avatar URL (from DB) */
    currentUrl: string | null
    /** Letter shown when no image */
    fallback: string
    /** Storage path without extension, e.g. "users/uuid" or "rooms/uuid" */
    storagePath: string
    /** Called with the new public URL after a successful upload */
    onUploaded: (url: string) => void
    className?: string
}

export function AvatarUpload({
    currentUrl,
    fallback,
    storagePath,
    onUploaded,
    className,
}: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(currentUrl)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Local preview immediately
        setPreview(URL.createObjectURL(file))
        setError(null)
        setUploading(true)

        try {
            const url = await uploadAvatar(file, storagePath)
            onUploaded(url)
        } catch {
            setError("Upload failed")
            setPreview(currentUrl)
        } finally {
            setUploading(false)
            // Reset so the same file can be re-selected
            e.target.value = ""
        }
    }

    return (
        <div className={cn("flex flex-col items-center gap-1", className)}>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Change avatar"
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={() => setPreview(null)}
                    />
                ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
                        {fallback.charAt(0).toUpperCase()}
                    </span>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {uploading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <HugeiconsIcon icon={Camera01Icon} size={20} className="text-white" />
                    )}
                </div>
            </button>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
            />
        </div>
    )
}
