import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useSendMessage } from "@/entities/message"

const pollSchema = z.object({
    question: z.string().min(1, "Required").max(500),
    options: z.array(z.string().min(1, "Required")).min(2, "At least 2 options"),
})
type PollForm = z.infer<typeof pollSchema>

interface CreatePollSheetProps {
    roomId: string
    onSuccess: () => void
}

export function CreatePollSheet({ roomId, onSuccess }: CreatePollSheetProps) {
    const { mutateAsync: sendMessage, isPending } = useSendMessage(roomId)
    const [options, setOptions] = useState(["", ""])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
    } = useForm<PollForm>({
        resolver: zodResolver(pollSchema),
        defaultValues: { question: "", options: ["", ""] },
    })

    function addOption() {
        if (options.length >= 10) return
        const next = [...getValues("options"), ""]
        setOptions(next)
        setValue("options", next)
    }

    function removeOption(idx: number) {
        if (options.length <= 2) return
        const next = getValues("options").filter((_, i) => i !== idx)
        setOptions(next)
        setValue("options", next)
    }

    async function onSubmit(data: PollForm) {
        await sendMessage({ type: "poll", payload: data })
        onSuccess()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <div>
                <Input
                    {...register("question")}
                    placeholder="Ask a question…"
                    className="text-sm"
                    autoFocus
                />
                {errors.question && (
                    <p className="mt-1 text-xs text-destructive">{errors.question.message}</p>
                )}
            </div>

            <div className="space-y-2">
                {options.map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Input
                            {...register(`options.${idx}`)}
                            placeholder={`Option ${idx + 1}`}
                            className="text-sm"
                        />
                        {options.length > 2 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(idx)}
                                aria-label="Remove option"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </Button>
                        )}
                    </div>
                ))}
                {errors.options && (
                    <p className="text-xs text-destructive">
                        {typeof errors.options.message === "string"
                            ? errors.options.message
                            : "Fix options"}
                    </p>
                )}
                {options.length < 10 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addOption}
                        className="text-muted-foreground"
                    >
                        <HugeiconsIcon icon={AddCircleIcon} size={16} className="mr-1" />
                        Add option
                    </Button>
                )}
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Sending…" : "Send Poll"}
            </Button>
        </form>
    )
}
