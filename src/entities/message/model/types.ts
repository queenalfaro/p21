import type { Tables, Json } from "@/shared/api"

// ── Payload shapes ─────────────────────────────────────────────────────────────

export type TextPayload = { text: string }
export type PollPayload = { question: string; options: string[] }
export type ChecklistPayload = { title: string; items: string[] }
export type RatingPayload = { question: string; options: string[] }
export type SystemPayload = { text: string; subtitle?: string }

// ── Core types ─────────────────────────────────────────────────────────────────

export type Message = Tables<"messages">
export type MessageType = NonNullable<Message["type"]>
export type MessageInteraction = Tables<"message_interactions">

export type MessageUser = {
    id: string
    name: string
    username: string | null
    avatar_url: string | null
}

export type ParentMessage = {
    id: string
    type: MessageType | null
    payload: Json | null
    user_id: string | null
    user: { id: string; name: string } | null
}

export type MessageWithUser = Message & {
    user: MessageUser | null
    parent?: ParentMessage | null
}
