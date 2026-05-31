import { supabase } from "@/shared/api"

const BUCKET = "avatars"

/** Uploads a file to storage.avatars/{path}.{ext} and returns the public URL. */
export async function uploadAvatar(file: File, storagePath: string): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const fullPath = `${storagePath}.${ext}`

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fullPath, file, { upsert: true, contentType: file.type })

    if (error) throw new Error(error.message)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
    return data.publicUrl
}
