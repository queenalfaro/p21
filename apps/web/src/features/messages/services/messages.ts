import { supabase, type Database } from "@/lib/supabase";

export type Message = Database["public"]["Tables"]["messages"]["Row"];

export async function sendMessage(text: string) {
    await supabase.from("messages").insert([{ text }]);
}

export async function getMessagesList() {
    const { data, error } = await supabase.from("messages").select("id, text");
    if (error) throw error;
    return data;
}

export function subscribeToRoom(
    onInsert: (m: Message) => void,
): () => void {
    const channel = supabase
        .channel("messages")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
            },
            (payload) => onInsert(payload.new as Message),
        )
        .subscribe();
    return () => {
        supabase.removeChannel(channel);
    };
}
