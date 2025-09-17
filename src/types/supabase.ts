export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      available_numbers: {
        Row: {
          area_code: string | null
          capabilities: Json | null
          country_code: string | null
          created_at: string | null
          friendly_name: string | null
          id: string
          monthly_price: number | null
          phone_number: string
          region: string | null
          twilio_sid: string | null
        }
        Insert: {
          area_code?: string | null
          capabilities?: Json | null
          country_code?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          monthly_price?: number | null
          phone_number: string
          region?: string | null
          twilio_sid?: string | null
        }
        Update: {
          area_code?: string | null
          capabilities?: Json | null
          country_code?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          monthly_price?: number | null
          phone_number?: string
          region?: string | null
          twilio_sid?: string | null
        }
        Relationships: []
      }
      call_flows: {
        Row: {
          created_at: string | null
          description: string | null
          flow_data: Json | null
          id: string
          name: string
          phone_number_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flow_data?: Json | null
          id?: string
          name: string
          phone_number_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flow_data?: Json | null
          id?: string
          name?: string
          phone_number_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_flows_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          call_flow_id: string | null
          created_at: string | null
          direction: string | null
          duration: number | null
          ended_at: string | null
          from_number: string | null
          id: string
          phone_number_id: string | null
          recording_url: string | null
          started_at: string | null
          status: string | null
          to_number: string | null
          twilio_call_sid: string | null
          user_id: string | null
        }
        Insert: {
          call_flow_id?: string | null
          created_at?: string | null
          direction?: string | null
          duration?: number | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          phone_number_id?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          to_number?: string | null
          twilio_call_sid?: string | null
          user_id?: string | null
        }
        Update: {
          call_flow_id?: string | null
          created_at?: string | null
          direction?: string | null
          duration?: number | null
          ended_at?: string | null
          from_number?: string | null
          id?: string
          phone_number_id?: string | null
          recording_url?: string | null
          started_at?: string | null
          status?: string | null
          to_number?: string | null
          twilio_call_sid?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_call_flow_id_fkey"
            columns: ["call_flow_id"]
            isOneToOne: false
            referencedRelation: "call_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          area_code: string | null
          capabilities: Json | null
          country_code: string | null
          created_at: string | null
          friendly_name: string | null
          id: string
          monthly_price: number | null
          phone_number: string
          purchased_at: string | null
          status: string | null
          twilio_sid: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          area_code?: string | null
          capabilities?: Json | null
          country_code?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          monthly_price?: number | null
          phone_number: string
          purchased_at?: string | null
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          area_code?: string | null
          capabilities?: Json | null
          country_code?: string | null
          created_at?: string | null
          friendly_name?: string | null
          id?: string
          monthly_price?: number | null
          phone_number?: string
          purchased_at?: string | null
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      porting_requests: {
        Row: {
          account_holder_name: string
          billing_address: string
          created_at: string | null
          current_carrier: string
          id: string
          loa_document_url: string | null
          phone_number: string
          status: string | null
          twilio_port_request_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_holder_name: string
          billing_address: string
          created_at?: string | null
          current_carrier: string
          id?: string
          loa_document_url?: string | null
          phone_number: string
          status?: string | null
          twilio_port_request_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder_name?: string
          billing_address?: string
          created_at?: string | null
          current_carrier?: string
          id?: string
          loa_document_url?: string | null
          phone_number?: string
          status?: string | null
          twilio_port_request_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancel_at_period_end: boolean | null
          canceled_at: number | null
          created_at: string
          currency: string | null
          current_period_end: number | null
          current_period_start: number | null
          custom_field_data: Json | null
          customer_cancellation_comment: string | null
          customer_cancellation_reason: string | null
          customer_id: string | null
          ended_at: number | null
          ends_at: number | null
          id: string
          interval: string | null
          metadata: Json | null
          price_id: string | null
          started_at: number | null
          status: string | null
          stripe_id: string | null
          stripe_price_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          custom_field_data?: Json | null
          customer_cancellation_comment?: string | null
          customer_cancellation_reason?: string | null
          customer_id?: string | null
          ended_at?: number | null
          ends_at?: number | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          price_id?: string | null
          started_at?: number | null
          status?: string | null
          stripe_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: number | null
          created_at?: string
          currency?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          custom_field_data?: Json | null
          customer_cancellation_comment?: string | null
          customer_cancellation_reason?: string | null
          customer_id?: string | null
          ended_at?: number | null
          ends_at?: number | null
          id?: string
          interval?: string | null
          metadata?: Json | null
          price_id?: string | null
          started_at?: number | null
          status?: string | null
          stripe_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          created_at: string | null
          id: string
          max_number_releases: number | null
          number_releases_used: number | null
          plan_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          max_number_releases?: number | null
          number_releases_used?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string | null
          id?: string
          max_number_releases?: number | null
          number_releases_used?: number | null
          plan_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: string | null
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          subscription: string | null
          token_identifier: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          modified_at: string
          stripe_event_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          modified_at?: string
          stripe_event_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          modified_at?: string
          stripe_event_id?: string | null
          type?: string
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
