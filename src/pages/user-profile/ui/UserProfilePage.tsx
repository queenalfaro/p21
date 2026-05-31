import { useNavigate } from "react-router"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Sun01Icon, Moon01Icon, SystemUpdate01Icon } from "@hugeicons/core-free-icons"
import { useUserStore, useUpdateUser } from "@/entities/user"
import { UpdateProfileForm } from "@/features/session"
import { AvatarUpload } from "@/shared/ui/avatar-upload"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/cn"

export function UserProfilePage() {
    const user = useUserStore((s) => s.user)
    const setUser = useUserStore((s) => s.setUser)
    const navigate = useNavigate()
    const updateUser = useUpdateUser(user?.id ?? "")
    const { theme, setTheme } = useTheme()

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
            <div className="px-6">
                <UpdateProfileForm user={user} onSuccess={() => navigate(-1)} />
            </div>

            {/* Appearance */}
            <div className="px-6 pb-8 pt-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Appearance
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {([
                        { value: "light", label: "Light", icon: Sun01Icon },
                        { value: "dark",  label: "Dark",  icon: Moon01Icon },
                        { value: "system",label: "System",icon: SystemUpdate01Icon },
                    ] as const).map(({ value, label, icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTheme(value)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
                                theme === value
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <HugeiconsIcon icon={icon} size={18} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
