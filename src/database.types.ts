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
      chatbots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: number
          settings: Json
          site_name: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: number
          settings?: Json
          site_name: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: number
          settings?: Json
          site_name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          reference_id: string
          user_email: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          reference_id: string
          user_email?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          reference_id?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          id: string
          metadata: Json
          organization_id: number
          title: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: number
          title: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      jobs: {
        Row: {
          chatbot_id: string
          completed_at: string | null
          created_at: string
          id: number
          organization_id: number
          status: Database["public"]["Enums"]["jobs_status"]
          tasks_completed_count: number
          tasks_count: number
          tasks_succeeded_count: number
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          completed_at?: string | null
          created_at?: string
          id?: never
          organization_id: number
          status?: Database["public"]["Enums"]["jobs_status"]
          tasks_completed_count?: number
          tasks_count?: number
          tasks_succeeded_count?: number
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          completed_at?: string | null
          created_at?: string
          id?: never
          organization_id?: number
          status?: Database["public"]["Enums"]["jobs_status"]
          tasks_completed_count?: number
          tasks_count?: number
          tasks_succeeded_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          code: string | null
          created_at: string
          id: number
          invited_email: string | null
          organization_id: number
          role: number
          user_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: never
          invited_email?: string | null
          organization_id: number
          role: number
          user_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: never
          invited_email?: string | null
          organization_id?: number
          role?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chatbot_id: string
          conversation_id: string
          created_at: string
          id: number
          sender: Database["public"]["Enums"]["sender"]
          text: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          chatbot_id: string
          conversation_id: string
          created_at?: string
          id?: number
          sender: Database["public"]["Enums"]["sender"]
          text: string
          type: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          chatbot_id?: string
          conversation_id?: string
          created_at?: string
          id?: number
          sender?: Database["public"]["Enums"]["sender"]
          text?: string
          type?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          link: string | null
          organization_id: number
          read: boolean
        }
        Insert: {
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          link?: string | null
          organization_id: number
          read?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          link?: string | null
          organization_id?: number
          read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: number
          logo_url: string | null
          name: string
          uuid: string
        }
        Insert: {
          created_at?: string
          id?: never
          logo_url?: string | null
          name: string
          uuid?: string
        }
        Update: {
          created_at?: string
          id?: never
          logo_url?: string | null
          name?: string
          uuid?: string
        }
        Relationships: []
      }
      organizations_subscriptions: {
        Row: {
          customer_id: string
          organization_id: number
          subscription_id: string | null
        }
        Insert: {
          customer_id: string
          organization_id: number
          subscription_id?: string | null
        }
        Update: {
          customer_id?: string
          organization_id?: number
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: true
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          max_chatbots: number
          max_documents: number
          max_messages: number
          name: string
          price_id: string
        }
        Insert: {
          max_chatbots: number
          max_documents: number
          max_messages: number
          name: string
          price_id: string
        }
        Update: {
          max_chatbots?: number
          max_documents?: number
          max_messages?: number
          name?: string
          price_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string | null
          currency: string | null
          id: string
          interval: string | null
          interval_count: number | null
          period_ends_at: string | null
          period_starts_at: string | null
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
        }
        Insert: {
          cancel_at_period_end: boolean
          created_at?: string | null
          currency?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string | null
          currency?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string | null
          period_starts_at?: string | null
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          onboarded: boolean
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          onboarded: boolean
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          onboarded?: boolean
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite_to_organization: {
        Args: {
          invite_code: string
          invite_user_id: string
        }
        Returns: Json
      }
      assert_service_role: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      can_create_chatbot: {
        Args: {
          org_id: number
        }
        Returns: boolean
      }
      can_index_documents: {
        Args: {
          org_id: number
          requested_documents: number
        }
        Returns: boolean
      }
      can_respond_to_message: {
        Args: {
          chatbot: string
        }
        Returns: boolean
      }
      can_update_user_role:
        | {
            Args: {
              membership_id: number
            }
            Returns: boolean
          }
        | {
            Args: {
              organization_id: number
              membership_id: number
            }
            Returns: boolean
          }
      create_new_organization: {
        Args: {
          org_name: string
          create_user?: boolean
        }
        Returns: string
      }
      current_user_is_member_of_organization: {
        Args: {
          organization_id: number
        }
        Returns: boolean
      }
      get_active_subscription: {
        Args: {
          org_id: number
        }
        Returns: {
          period_starts_at: string
          period_ends_at: string
          price_id: string
          interval: string
        }[]
      }
      get_organizations_for_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: number[]
      }
      get_role_for_authenticated_user: {
        Args: {
          org_id: number
        }
        Returns: number
      }
      get_role_for_user: {
        Args: {
          membership_id: number
        }
        Returns: number
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      transfer_organization: {
        Args: {
          org_id: number
          target_user_membership_id: number
        }
        Returns: undefined
      }
    }
    Enums: {
      jobs_status: "pending" | "running" | "completed" | "failed"
      message_type: "ai" | "db" | "user"
      sender: "user" | "assistant"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
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

