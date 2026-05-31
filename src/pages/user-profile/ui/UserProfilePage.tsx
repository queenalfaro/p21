import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useUserStore, useUpdateUser } from "@/entities/user"
import { UpdateProfileForm } from "@/features/session"
import { AvatarUpload } from "@/shared/ui/avatar-upload"
import { Button } from "@/shared/ui/button"

export function UserProfilePage() {
    const user = useUserStore((s) => s.user)
    const setUser = useUserStore((s) => s.setUser)
    const navigate = useNavigate()
    const updateUser = useUpdateUser(user?.id ?? "")

    if (!user) return null

    async function handleAvatarUpload(url: string) {
        const updated = await updateUser.mutateAsync({ avatar_url: url })
        setUser(updated)
    }

    return (
        <div className="flex min-h-svh flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="text-base font-semibold">Profile</h1>
            </div>

            {/* Avatar — click to change instantly */}
            <div className="flex flex-col items-center gap-3 px-6 py-8">
                <AvatarUpload
                    currentUrl={user.avatar_url}
                    fallback={user.name}
                    storagePath={`users/${user.id}`}
                    onUploaded={handleAvatarUpload}
                />
                <div className="text-center">
                    <p className="font-semibold">{user.name}</p>
                    {user.username && (
                        <p className="text-muted-foreground text-sm">@{user.username}</p>
                    )}
                    <span className="text-muted-foreground mt-1 inline-block rounded-full border px-2 py-0.5 text-xs">
                        {user.is_anonymous ? "Anonymous" : "Full account"}
                    </span>
                </div>
            </div>

            {/* Form — name + username only */}
            <div className="flex-1 px-6 pb-8">
                <UpdateProfileForm user={user} onSuccess={() => navigate(-1)} />
            </div>
        </div>
    )
}
