import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateRoom } from "@/entities/room"
import { getCurrentUserId } from "@/shared/lib/identity"
import { slugify } from "@/shared/lib/slugify"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { createRoomSchema, type CreateRoomValues } from "../model"
import type { Room } from "@/entities/room"

interface CreateRoomFormProps {
    onSuccess: (room: Room) => void
}

export function CreateRoomForm({ onSuccess }: CreateRoomFormProps) {
    const userId = getCurrentUserId()
    const createRoom = useCreateRoom(userId)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting, touchedFields },
    } = useForm<CreateRoomValues>({
        resolver: zodResolver(createRoomSchema),
        defaultValues: { name: "", roomname: "", description: "", starts_at: "" },
    })

    async function onSubmit(values: CreateRoomValues) {
        const room = await createRoom.mutateAsync({
            name: values.name,
            roomname: values.roomname,
            description: values.description || null,
            starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
        })
        onSuccess(room)
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-4 py-6">
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Room name</Label>
                <Input
                    id="name"
                    placeholder="e.g. Tech Conference 2026"
                    {...register("name", {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            if (!touchedFields.roomname) {
                                setValue("roomname", slugify(e.target.value), {
                                    shouldValidate: false,
                                })
                            }
                        },
                    })}
                />
                {errors.name && (
                    <p className="text-destructive text-xs">{errors.name.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="roomname">
                    Room handle{" "}
                    <span className="text-muted-foreground font-normal">(used in invite links)</span>
                </Label>
                <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                        @
                    </span>
                    <Input
                        id="roomname"
                        className="pl-7"
                        placeholder="tech-conf-2026"
                        {...register("roomname")}
                    />
                </div>
                {errors.roomname && (
                    <p className="text-destructive text-xs">{errors.roomname.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                    id="description"
                    placeholder="What's this event about?"
                    rows={3}
                    className="resize-none"
                    {...register("description")}
                />
                {errors.description && (
                    <p className="text-destructive text-xs">{errors.description.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="starts_at">
                    Start date{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
            </div>

            {createRoom.error && (
                <p className="text-destructive text-sm">
                    {createRoom.error instanceof Error
                        ? createRoom.error.message
                        : "Failed to create room"}
                </p>
            )}

            <Button type="submit" disabled={isSubmitting || createRoom.isPending} className="mt-1">
                {createRoom.isPending ? "Creating…" : "Create Room"}
            </Button>
        </form>
    )
}
