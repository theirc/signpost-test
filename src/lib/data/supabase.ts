export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      agents: {
        Row: {
          created_at: string
          edges: Json | null
          id: number
          title: string | null
        }
        Insert: {
          created_at?: string
          edges?: Json | null
          id?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          edges?: Json | null
          id?: number
          title?: string | null
        }
        Relationships: []
      }
      bot_conversations: {
        Row: {
          bot_id: string | null
          bot_response: string | null
          created_at: string | null
          id: string
          session_id: string | null
          user_message: string | null
        }
        Insert: {
          bot_id?: string | null
          bot_response?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_message?: string | null
        }
        Update: {
          bot_id?: string | null
          bot_response?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_conversations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          collection: string | null
          created_at: string | null
          id: string
          model: string
          name: string
          system_prompt: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          collection?: string | null
          created_at?: string | null
          id?: string
          model: string
          name: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          collection?: string | null
          created_at?: string | null
          id?: string
          model?: string
          name?: string
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bots_collection_id_fkey"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bots_model"
            columns: ["model"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_sources: {
        Row: {
          collection_id: string
          source_id: string
        }
        Insert: {
          collection_id: string
          source_id: string
        }
        Update: {
          collection_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_sources_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          name: string
          provider: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          name: string
          provider?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          name?: string
          provider?: string | null
        }
        Relationships: []
      }
      source_configs: {
        Row: {
          bot_log: string | null
          crawl_depth: number | null
          enabled: number
          extract_main_content: number | null
          include_external_links: number | null
          map: string | null
          max_links: number | null
          max_total_links: number | null
          prompt: string | null
          sitemap: string | null
          source: string
          subdomain: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          bot_log?: string | null
          crawl_depth?: number | null
          enabled?: number
          extract_main_content?: number | null
          include_external_links?: number | null
          map?: string | null
          max_links?: number | null
          max_total_links?: number | null
          prompt?: string | null
          sitemap?: string | null
          source: string
          subdomain?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          bot_log?: string | null
          crawl_depth?: number | null
          enabled?: number
          extract_main_content?: number | null
          include_external_links?: number | null
          map?: string | null
          max_links?: number | null
          max_total_links?: number | null
          prompt?: string | null
          sitemap?: string | null
          source?: string
          subdomain?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_configs_source_fkey"
            columns: ["source"]
            isOneToOne: true
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          last_updated: string | null
          name: string
          tags: string[] | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name: string
          tags?: string[] | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          tags?: string[] | null
          type?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          agent: number | null
          created_at: string
          handles: Json | null
          id: string
          type: string | null
          x: number | null
          y: number | null
        }
        Insert: {
          agent?: number | null
          created_at?: string
          handles?: Json | null
          id: string
          type?: string | null
          x?: number | null
          y?: number | null
        }
        Update: {
          agent?: number | null
          created_at?: string
          handles?: Json | null
          id?: string
          type?: string | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_agent_fkey"
            columns: ["agent"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
