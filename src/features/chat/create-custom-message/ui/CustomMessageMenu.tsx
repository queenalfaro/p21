import { useState } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/shared/ui/drawer"
import { CreatePollSheet } from "./CreatePollSheet"
import { CreateChecklistSheet } from "./CreateChecklistSheet"
import { CreateRatingSheet } from "./CreateRatingSheet"

type CustomType = "poll" | "checklist" | "rating" | null

interface CustomMessageMenuProps {
    roomId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

const TYPES: { key: CustomType & string; emoji: string; label: string; description: string }[] = [
    { key: "poll", emoji: "📊", label: "Poll", description: "Ask a question with options" },
    { key: "checklist", emoji: "☑️", label: "Checklist", description: "Track tasks together" },
    { key: "rating", emoji: "⭐", label: "Rating", description: "Collect 1–5 star feedback" },
]

export function CustomMessageMenu({ roomId, open, onOpenChange }: CustomMessageMenuProps) {
    const [selected, setSelected] = useState<CustomType>(null)

    function handleClose() {
        onOpenChange(false)
        // Reset after animation
        setTimeout(() => setSelected(null), 300)
    }

    function handleSuccess() {
        handleClose()
    }

    return (
        <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>
                        {selected === "poll"
                            ? "📊 New Poll"
                            : selected === "checklist"
                              ? "☑️ New Checklist"
                              : selected === "rating"
                                ? "⭐ New Rating"
                                : "Add to chat"}
                    </DrawerTitle>
                </DrawerHeader>

                {!selected ? (
                    <div className="grid grid-cols-3 gap-3 p-4">
                        {TYPES.map(({ key, emoji, label, description }) => (
                            <button
                                key={key}
                                onClick={() => setSelected(key)}
                                className="flex flex-col items-center gap-1.5 rounded-xl bg-muted p-3 text-center transition-colors hover:bg-muted/80 active:scale-95"
                            >
                                <span className="text-2xl">{emoji}</span>
                                <span className="text-xs font-medium">{label}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {description}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : selected === "poll" ? (
                    <CreatePollSheet roomId={roomId} onSuccess={handleSuccess} />
                ) : selected === "checklist" ? (
                    <CreateChecklistSheet roomId={roomId} onSuccess={handleSuccess} />
                ) : (
                    <CreateRatingSheet roomId={roomId} onSuccess={handleSuccess} />
                )}
            </DrawerContent>
        </Drawer>
    )
}
