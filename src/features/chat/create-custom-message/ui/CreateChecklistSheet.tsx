import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useSendMessage } from "@/entities/message"

const checklistSchema = z.object({
    title: z.string().min(1, "Required").max(500),
    items: z.array(z.string().min(1, "Required")).min(1, "At least 1 item"),
})
type ChecklistForm = z.infer<typeof checklistSchema>

interface CreateChecklistSheetProps {
    roomId: string
    onSuccess: () => void
}

export function CreateChecklistSheet({ roomId, onSuccess }: CreateChecklistSheetProps) {
    const { mutateAsync: sendMessage, isPending } = useSendMessage(roomId)
    const [items, setItems] = useState([""])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
    } = useForm<ChecklistForm>({
        resolver: zodResolver(checklistSchema),
        defaultValues: { title: "", items: [""] },
    })

    function addItem() {
        if (items.length >= 20) return
        const next = [...getValues("items"), ""]
        setItems(next)
        setValue("items", next)
    }

    function removeItem(idx: number) {
        if (items.length <= 1) return
        const next = getValues("items").filter((_, i) => i !== idx)
        setItems(next)
        setValue("items", next)
    }

    async function onSubmit(data: ChecklistForm) {
        await sendMessage({ type: "checklist", payload: data })
        onSuccess()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <div>
                <Input
                    {...register("title")}
                    placeholder="Checklist title…"
                    className="text-sm"
                    autoFocus
                />
                {errors.title && (
                    <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
                )}
            </div>

            <div className="space-y-2">
                {items.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Input
                            {...register(`items.${idx}`)}
                            placeholder={`Item ${idx + 1}`}
                            className="text-sm"
                        />
                        {items.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(idx)}
                                aria-label="Remove item"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </Button>
                        )}
                    </div>
                ))}
                {errors.items && (
                    <p className="text-xs text-destructive">
                        {typeof errors.items.message === "string"
                            ? errors.items.message
                            : "Fix items"}
                    </p>
                )}
                {items.length < 20 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addItem}
                        className="text-muted-foreground"
                    >
                        <HugeiconsIcon icon={AddCircleIcon} size={16} className="mr-1" />
                        Add item
                    </Button>
                )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Sending…" : "Send Checklist"}
            </Button>
        </form>
    )
}
