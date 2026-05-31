import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useUserStore } from "@/entities/user"
import { UpdateProfileForm } from "@/features/session"
import { Button } from "@/shared/ui/button"

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("")

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className="h-24 w-24 rounded-full object-cover"
            />
        )
    }
    return (
        <div className="bg-primary text-primary-foreground flex h-24 w-24 items-center justify-center rounded-full text-3xl font-semibold">
            {initials}
        </div>
    )
}

export function UserProfilePage() {
    const user = useUserStore((s) => s.user)
    const navigate = useNavigate()

    if (!user) return null

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

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 px-6 py-8">
                <UserAvatar name={user.name} avatarUrl={user.avatar_url} />
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

            {/* Form */}
            <div className="flex-1 px-6 pb-8">
                <UpdateProfileForm user={user} onSuccess={() => navigate(-1)} />
            </div>
        </div>
    )
}
