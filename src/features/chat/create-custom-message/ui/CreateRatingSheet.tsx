import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useSendMessage } from "@/entities/message"

const ratingSchema = z.object({
    question: z.string().min(1, "Required").max(500),
})
type RatingForm = z.infer<typeof ratingSchema>

// Rating payload: { question, options: ["1","2","3","4","5"] } — fixed 1–5 stars.

interface CreateRatingSheetProps {
    roomId: string
    onSuccess: () => void
}

export function CreateRatingSheet({ roomId, onSuccess }: CreateRatingSheetProps) {
    const { mutateAsync: sendMessage, isPending } = useSendMessage(roomId)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RatingForm>({
        resolver: zodResolver(ratingSchema),
        defaultValues: { question: "" },
    })

    async function onSubmit(data: RatingForm) {
        await sendMessage({
            type: "rating",
            payload: { question: data.question, options: ["1", "2", "3", "4", "5"] },
        })
        onSuccess()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
            <div>
                <Input
                    {...register("question")}
                    placeholder="Rate something…"
                    className="text-sm"
                    autoFocus
                />
                {errors.question && (
                    <p className="mt-1 text-xs text-destructive">{errors.question.message}</p>
                )}
            </div>
            <p className="text-center text-2xl tracking-widest">⭐⭐⭐⭐⭐</p>
            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Sending…" : "Send Rating"}
            </Button>
        </form>
    )
}
