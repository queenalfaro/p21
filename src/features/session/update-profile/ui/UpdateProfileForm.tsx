import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useUpdateUser, useUserStore, type User } from "@/entities/user"
import { updateProfileSchema, type UpdateProfileData } from "../model"

interface UpdateProfileFormProps {
    user: User
    onSuccess?: () => void
}

export function UpdateProfileForm({ user, onSuccess }: UpdateProfileFormProps) {
    const setUser = useUserStore((s) => s.setUser)
    const updateUser = useUpdateUser(user.id)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<UpdateProfileData>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            name: user.name,
            username: user.username ?? "",
        },
    })

    const onSubmit = async (data: UpdateProfileData) => {
        const updated = await updateUser.mutateAsync({
            name: data.name,
            username: data.username || null,
            is_anonymous: !data.username,
        })
        setUser(updated)
        onSuccess?.()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                    Name
                </label>
                <Input id="name" placeholder="Your name" {...register("name")} />
                {errors.name && (
                    <p className="text-destructive text-xs">{errors.name.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium">
                    Username{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                    <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                        @
                    </span>
                    <Input
                        id="username"
                        className="pl-7"
                        placeholder="username"
                        {...register("username")}
                    />
                </div>
                {errors.username && (
                    <p className="text-destructive text-xs">{errors.username.message}</p>
                )}
            </div>

            {updateUser.error && (
                <p className="text-destructive text-sm">
                    {updateUser.error instanceof Error
                        ? updateUser.error.message
                        : "Something went wrong"}
                </p>
            )}

            <Button type="submit" disabled={isSubmitting || !isDirty} className="mt-2">
                {isSubmitting ? "Saving…" : "Save"}
            </Button>
        </form>
    )
}
