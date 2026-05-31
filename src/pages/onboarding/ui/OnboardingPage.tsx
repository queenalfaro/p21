import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Navigate, useNavigate } from "react-router"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useUpsertUser, useUserStore } from "@/entities/user"
import { getCurrentUserId } from "@/shared/lib/identity"

const schema = z.object({
    name: z.string().min(1, "Enter your name").max(255),
})
type FormData = z.infer<typeof schema>

export function OnboardingPage() {
    const user = useUserStore((s) => s.user)
    const setUser = useUserStore((s) => s.setUser)
    const upsertUser = useUpsertUser()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) })

    // Already initialized — skip onboarding
    if (user) return <Navigate to="/" replace />

    const onSubmit = async ({ name }: FormData) => {
        const created = await upsertUser.mutateAsync({
            id: getCurrentUserId(),
            name,
            is_anonymous: true,
        })
        setUser(created)
        navigate("/", { replace: true })
    }

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold">
                    E
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Event App</h1>
                <p className="text-muted-foreground text-sm">Enter your name to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-3">
                <Input
                    placeholder="Your name"
                    autoFocus
                    autoComplete="name"
                    {...register("name")}
                />
                {errors.name && (
                    <p className="text-destructive text-xs">{errors.name.message}</p>
                )}
                {upsertUser.error && (
                    <p className="text-destructive text-xs">
                        {upsertUser.error instanceof Error
                            ? upsertUser.error.message
                            : "Something went wrong"}
                    </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account…" : "Continue"}
                </Button>
            </form>
        </div>
    )
}
