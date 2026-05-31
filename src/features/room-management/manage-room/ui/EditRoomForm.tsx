import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useGetRoom, useUpdateRoom } from "@/entities/room"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { editRoomSchema, type EditRoomValues } from "../model/schema"

function toDatetimeLocal(iso: string | null): string {
    if (!iso) return ""
    return iso.slice(0, 16)
}

function fromDatetimeLocal(local: string): string | undefined {
    if (!local) return undefined
    return new Date(local).toISOString()
}

interface EditRoomFormProps {
    roomId: string
}

export function EditRoomForm({ roomId }: EditRoomFormProps) {
    const { data: room } = useGetRoom(roomId)
    const { mutateAsync: updateRoom, isPending } = useUpdateRoom(roomId)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty },
    } = useForm<EditRoomValues>({
        resolver: zodResolver(editRoomSchema),
    })

    const avatarUrlValue = watch("avatar_url")
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    // Populate form when room data arrives
    useEffect(() => {
        if (!room) return
        reset({
            name: room.name,
            description: room.description ?? "",
            avatar_url: room.avatar_url ?? "",
            status: (room.status as EditRoomValues["status"]) ?? "draft",
            starts_at: toDatetimeLocal(room.starts_at),
            ends_at: toDatetimeLocal(room.ends_at),
        })
        setAvatarPreview(room.avatar_url ?? null)
    }, [room, reset])

    // Update preview when URL field changes
    useEffect(() => {
        setAvatarPreview(avatarUrlValue || null)
    }, [avatarUrlValue])

    async function onSubmit(values: EditRoomValues) {
        try {
            await updateRoom({
                name: values.name,
                description: values.description || null,
                avatar_url: values.avatar_url || null,
                status: values.status,
                starts_at: values.starts_at ? fromDatetimeLocal(values.starts_at) : null,
                ends_at: values.ends_at ? fromDatetimeLocal(values.ends_at) : null,
            })
            toast.success("Room updated")
            reset(values) // mark form as clean
        } catch {
            toast.error("Failed to update room")
        }
    }

    if (!room) {
        return (
            <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4">
            {/* Avatar preview + URL input */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Room avatar"
                                className="h-full w-full object-cover"
                                onError={() => setAvatarPreview(null)}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
                                {room.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor="room-avatar" className="text-xs">Avatar URL</Label>
                        <Input
                            id="room-avatar"
                            {...register("avatar_url")}
                            placeholder="https://…"
                            className="text-sm"
                        />
                    </div>
                </div>
                {errors.avatar_url && (
                    <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
                )}
            </div>

            <div className="space-y-1">
                <Label htmlFor="room-name" className="text-xs">Name</Label>
                <Input id="room-name" {...register("name")} className="text-sm" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="room-desc" className="text-xs">Description</Label>
                <Textarea
                    id="room-desc"
                    {...register("description")}
                    className="resize-none text-sm"
                    rows={3}
                />
            </div>

            <div className="space-y-1">
                <Label htmlFor="room-status" className="text-xs">Status</Label>
                <select
                    id="room-status"
                    {...register("status")}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-1"
                >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="room-starts" className="text-xs">Starts</Label>
                    <input
                        id="room-starts"
                        type="datetime-local"
                        {...register("starts_at")}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-1"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="room-ends" className="text-xs">Ends</Label>
                    <input
                        id="room-ends"
                        type="datetime-local"
                        {...register("ends_at")}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-1"
                    />
                </div>
            </div>

            <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={isPending || !isDirty}
            >
                {isPending ? "Saving…" : "Save Changes"}
            </Button>
        </form>
    )
}
