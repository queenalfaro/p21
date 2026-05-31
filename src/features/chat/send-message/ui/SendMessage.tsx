import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sent02Icon, MoreHorizontalCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useSendMessage, ReplyQuote } from "@/entities/message"
import type { MessageWithUser } from "@/entities/message"
import { Button } from "@/shared/ui/button"
import { CustomMessageMenu } from "@/features/chat/create-custom-message"

interface SendMessageProps {
    roomId: string
    replyTo: MessageWithUser | null
    onClearReply: () => void
}

export function SendMessage({ roomId, replyTo, onClearReply }: SendMessageProps) {
    const [text, setText] = useState("")
    const [menuOpen, setMenuOpen] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { mutateAsync: sendMessage, isPending } = useSendMessage(roomId)

    function resizeTextarea() {
        const el = textareaRef.current
        if (!el) return
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, 128)}px`
    }

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setText(e.target.value)
        resizeTextarea()
    }

    async function handleSend() {
        const trimmed = text.trim()
        if (!trimmed || isPending) return
        setText("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"
        await sendMessage({
            type: "text",
            payload: { text: trimmed },
            parent_id: replyTo?.id ?? null,
        })
        onClearReply()
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
        if (e.key === "Escape" && replyTo) {
            onClearReply()
        }
    }

    const hasText = text.trim().length > 0

    return (
        <>
            <CustomMessageMenu roomId={roomId} open={menuOpen} onOpenChange={setMenuOpen} />

            <div className="bg-background border-t">
                {/* Reply preview */}
                {replyTo && (
                    <div className="flex items-center gap-2 border-b px-3 py-1.5">
                        <ReplyQuote
                            parent={{
                                id: replyTo.id,
                                type: replyTo.type,
                                payload: replyTo.payload,
                                user_id: replyTo.user_id,
                                user: replyTo.user
                                    ? { id: replyTo.user.id, name: replyTo.user.name }
                                    : null,
                            }}
                            className="flex-1 bg-muted"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClearReply}
                            aria-label="Cancel reply"
                            className="shrink-0"
                        >
                            <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        </Button>
                    </div>
                )}

                {/* Input row */}
                <div className="flex items-end gap-2 px-3 py-2">
                    <textarea
                        ref={textareaRef}
                        className="flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                        style={{ minHeight: "36px", maxHeight: "128px" }}
                        placeholder="Message…"
                        value={text}
                        rows={1}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                    />

                    {hasText ? (
                        <Button
                            size="icon"
                            className="shrink-0"
                            onClick={handleSend}
                            disabled={isPending}
                            aria-label="Send message"
                        >
                            <HugeiconsIcon icon={Sent02Icon} size={18} />
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="shrink-0 text-muted-foreground"
                            aria-label="Add poll, checklist or rating"
                            onClick={() => setMenuOpen(true)}
                        >
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={20} />
                        </Button>
                    )}
                </div>
            </div>
        </>
    )
}
