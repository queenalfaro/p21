export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.5"
    }
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json
                    operationName?: string
                    query?: string
                    variables?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            analytics_timeline: {
                Row: {
                    bucket_time: string
                    distracted_count: number | null
                    engaged_count: number | null
                    room_id: string
                    unknown_count: number | null
                }
                Insert: {
                    bucket_time: string
                    distracted_count?: number | null
                    engaged_count?: number | null
                    room_id: string
                    unknown_count?: number | null
                }
                Update: {
                    bucket_time?: string
                    distracted_count?: number | null
                    engaged_count?: number | null
                    room_id?: string
                    unknown_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "analytics_timeline_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            current_user_states: {
                Row: {
                    last_ping_at: string | null
                    room_id: string | null
                    status: string
                    user_id: string
                }
                Insert: {
                    last_ping_at?: string | null
                    room_id?: string | null
                    status: string
                    user_id: string
                }
                Update: {
                    last_ping_at?: string | null
                    room_id?: string | null
                    status?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "current_user_states_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            message_interactions: {
                Row: {
                    created_at: string | null
                    id: string
                    interaction_type: string
                    message_id: string | null
                    user_id: string | null
                    value: Json
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    interaction_type: string
                    message_id?: string | null
                    user_id?: string | null
                    value: Json
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    interaction_type?: string
                    message_id?: string | null
                    user_id?: string | null
                    value?: Json
                }
                Relationships: [
                    {
                        foreignKeyName: "message_interactions_message_id_fkey"
                        columns: ["message_id"]
                        isOneToOne: false
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "message_interactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            messages: {
                Row: {
                    created_at: string | null
                    id: string
                    parent_id: string | null
                    payload: Json | null
                    room_id: string | null
                    type: Database["public"]["Enums"]["message_type"] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    parent_id?: string | null
                    payload?: Json | null
                    room_id?: string | null
                    type?: Database["public"]["Enums"]["message_type"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    parent_id?: string | null
                    payload?: Json | null
                    room_id?: string | null
                    type?: Database["public"]["Enums"]["message_type"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            room_members: {
                Row: {
                    joined_at: string | null
                    permissions: Json | null
                    role: Database["public"]["Enums"]["room_role"] | null
                    room_id: string
                    user_id: string
                }
                Insert: {
                    joined_at?: string | null
                    permissions?: Json | null
                    role?: Database["public"]["Enums"]["room_role"] | null
                    room_id: string
                    user_id: string
                }
                Update: {
                    joined_at?: string | null
                    permissions?: Json | null
                    role?: Database["public"]["Enums"]["room_role"] | null
                    room_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "room_members_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "room_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rooms: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    description: string | null
                    ends_at: string | null
                    id: string
                    name: string
                    roomname: string
                    settings: Json | null
                    starts_at: string | null
                    status: Database["public"]["Enums"]["room_status"] | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    ends_at?: string | null
                    id?: string
                    name: string
                    roomname: string
                    settings?: Json | null
                    starts_at?: string | null
                    status?: Database["public"]["Enums"]["room_status"] | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    ends_at?: string | null
                    id?: string
                    name?: string
                    roomname?: string
                    settings?: Json | null
                    starts_at?: string | null
                    status?: Database["public"]["Enums"]["room_status"] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            users: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    id: string
                    is_anonymous: boolean | null
                    name: string
                    settings: Json | null
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    id?: string
                    is_anonymous?: boolean | null
                    name: string
                    settings?: Json | null
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    id?: string
                    is_anonymous?: boolean | null
                    name?: string
                    settings?: Json | null
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            take_analytics_snapshot: { Args: never; Returns: undefined }
            update_my_status: {
                Args: { p_room_id: string; p_status: string; p_user_id: string }
                Returns: undefined
            }
        }
        Enums: {
            message_type: "text" | "poll" | "checklist" | "rating" | "system"
            room_role: "admin" | "user"
            room_status: "draft" | "active" | "completed"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
            DefaultSchema["Views"])
      ? (DefaultSchema["Tables"] &
            DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
          ? R
          : never
      : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I
        }
          ? I
          : never
      : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema["Tables"]
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U
        }
          ? U
          : never
      : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema["Enums"]
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
      ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
      : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema["CompositeTypes"]
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
      ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            message_type: ["text", "poll", "checklist", "rating", "system"],
            room_role: ["admin", "user"],
            room_status: ["draft", "active", "completed"],
        },
    },
} as const
