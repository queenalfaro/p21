import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { TablesInsert, TablesUpdate } from "@/shared/api"

export function useUpsertUser() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: TablesInsert<"users">) => {
            const { data, error } = await supabase
                .from("users")
                .upsert(input, { onConflict: "id" })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            qc.setQueryData(["user", data.id], data)
        },
    })
}

export function useUpdateUser(userId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (input: TablesUpdate<"users">) => {
            const { data, error } = await supabase
                .from("users")
                .update(input)
                .eq("id", userId)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            qc.setQueryData(["user", userId], data)
        },
    })
}
