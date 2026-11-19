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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_spend_daily: {
        Row: {
          blocked_budget: number
          day: string
          failed: number
          requests: number
          reserved_credits: number
          spent_credits: number
          succeeded: number
          updated_at: string
        }
        Insert: {
          blocked_budget?: number
          day: string
          failed?: number
          requests?: number
          reserved_credits?: number
          spent_credits?: number
          succeeded?: number
          updated_at?: string
        }
        Update: {
          blocked_budget?: number
          day?: string
          failed?: number
          requests?: number
          reserved_credits?: number
          spent_credits?: number
          succeeded?: number
          updated_at?: string
        }
        Relationships: []
      }
      check_daily_total: {
        Row: {
          count: number
          day: string
        }
        Insert: {
          count?: number
          day?: string
        }
        Update: {
          count?: number
          day?: string
        }
        Relationships: []
      }
      check_device_usage: {
        Row: {
          day: string
          day_count: number
          device_id: string
          lifetime: number
          updated_at: string
        }
        Insert: {
          day?: string
          day_count?: number
          device_id: string
          lifetime?: number
          updated_at?: string
        }
        Update: {
          day?: string
          day_count?: number
          device_id?: string
          lifetime?: number
          updated_at?: string
        }
        Relationships: []
      }
      check_ip_free: {
        Row: {
          count: number
          day: string
          ip_hash: string
        }
        Insert: {
          count?: number
          day?: string
          ip_hash: string
        }
        Update: {
          count?: number
          day?: string
          ip_hash?: string
        }
        Relationships: []
      }
      check_ip_usage: {
        Row: {
          count: number
          day: string
          ip_hash: string
        }
        Insert: {
          count?: number
          day?: string
          ip_hash: string
        }
        Update: {
          count?: number
          day?: string
          ip_hash?: string
        }
        Relationships: []
      }
      check_limits: {
        Row: {
          active_timeout_seconds: number
          ai_daily_budget_usd: number
          ai_kill_switch: boolean
          ai_monthly_budget_usd: number
          billing_live: boolean
          credits_per_input_token: number
          credits_per_output_token: number
          device_daily: number
          enabled: boolean
          enforce_free_quota: boolean
          free_ip_daily: number
          free_lifetime: number
          global_daily: number
          id: boolean
          ip_daily: number
          max_attempts_per_request: number
          max_moves_30d: number
          premium_monthly: number
          reserve_credits_per_check: number
          usd_per_credit: number
        }
        Insert: {
          active_timeout_seconds?: number
          ai_daily_budget_usd?: number
          ai_kill_switch?: boolean
          ai_monthly_budget_usd?: number
          billing_live?: boolean
          credits_per_input_token?: number
          credits_per_output_token?: number
          device_daily?: number
          enabled?: boolean
          enforce_free_quota?: boolean
          free_ip_daily?: number
          free_lifetime?: number
          global_daily?: number
          id?: boolean
          ip_daily?: number
          max_attempts_per_request?: number
          max_moves_30d?: number
          premium_monthly?: number
          reserve_credits_per_check?: number
          usd_per_credit?: number
        }
        Update: {
          active_timeout_seconds?: number
          ai_daily_budget_usd?: number
          ai_kill_switch?: boolean
          ai_monthly_budget_usd?: number
          billing_live?: boolean
          credits_per_input_token?: number
          credits_per_output_token?: number
          device_daily?: number
          enabled?: boolean
          enforce_free_quota?: boolean
          free_ip_daily?: number
          free_lifetime?: number
          global_daily?: number
          id?: boolean
          ip_daily?: number
          max_attempts_per_request?: number
          max_moves_30d?: number
          premium_monthly?: number
          reserve_credits_per_check?: number
          usd_per_credit?: number
        }
        Relationships: []
      }
      check_premium_usage: {
        Row: {
          count: number
          device_id: string
          period_start: string
        }
        Insert: {
          count?: number
          device_id: string
          period_start: string
        }
        Update: {
          count?: number
          device_id?: string
          period_start?: string
        }
        Relationships: []
      }
      check_requests: {
        Row: {
          attempts: number
          created_at: string
          device_id: string
          failure: string | null
          finished_at: string | null
          ip_hash: string
          period_start: string | null
          premium: boolean
          request_id: string
          reserved_credits: number
          result: Json | null
          spend_day: string
          spent_credits: number
          started_at: string
          status: string
          word: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          device_id: string
          failure?: string | null
          finished_at?: string | null
          ip_hash: string
          period_start?: string | null
          premium?: boolean
          request_id: string
          reserved_credits?: number
          result?: Json | null
          spend_day?: string
          spent_credits?: number
          started_at?: string
          status: string
          word: string
        }
        Update: {
          attempts?: number
          created_at?: string
          device_id?: string
          failure?: string | null
          finished_at?: string | null
          ip_hash?: string
          period_start?: string | null
          premium?: boolean
          request_id?: string
          reserved_credits?: number
          result?: Json | null
          spend_day?: string
          spent_credits?: number
          started_at?: string
          status?: string
          word?: string
        }
        Relationships: []
      }
      entitlement_moves: {
        Row: {
          device_id: string
          moved_at: string
          original_transaction_id: string
        }
        Insert: {
          device_id: string
          moved_at?: string
          original_transaction_id: string
        }
        Update: {
          device_id?: string
          moved_at?: string
          original_transaction_id?: string
        }
        Relationships: []
      }
      premium_entitlements: {
        Row: {
          device_id: string
          original_transaction_id: string
          period_end: string
          period_start: string
          platform: string
          product_id: string
          verified_at: string
        }
        Insert: {
          device_id: string
          original_transaction_id: string
          period_end: string
          period_start: string
          platform: string
          product_id: string
          verified_at?: string
        }
        Update: {
          device_id?: string
          original_transaction_id?: string
          period_end?: string
          period_start?: string
          platform?: string
          product_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      receipt_diagnostics: {
        Row: {
          code: string
          created_at: string
          detail: string
          id: number
          platform: string
          stage: string
        }
        Insert: {
          code: string
          created_at?: string
          detail: string
          id?: never
          platform: string
          stage: string
        }
        Update: {
          code?: string
          created_at?: string
          detail?: string
          id?: never
          platform?: string
          stage?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_spend_overview: {
        Row: {
          blocked_budget: number | null
          day: string | null
          failed: number | null
          requests: number | null
          reserved_credits: number | null
          spent_credits: number | null
          spent_usd: number | null
          succeeded: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      ai_spend_report: { Args: never; Returns: Json }
      begin_check: {
        Args: { _device: string; _ip: string; _request: string; _word: string }
        Returns: Json
      }
      begin_check_core: {
        Args: {
          _device: string
          _enforce_free: boolean
          _ip: string
          _request: string
          _word: string
        }
        Returns: Json
      }
      check_status: { Args: { _device: string }; Returns: Json }
      consume_check: { Args: { _device: string; _ip: string }; Returns: Json }
      finish_check: {
        Args: {
          _credits: number
          _failure: string
          _outcome: string
          _request: string
          _result: Json
        }
        Returns: Json
      }
      finish_check_tokens: {
        Args: {
          _failure: string
          _input_tokens: number
          _outcome: string
          _output_tokens: number
          _request: string
          _result: Json
        }
        Returns: Json
      }
      grant_entitlement: {
        Args: {
          _device: string
          _end: string
          _original: string
          _platform: string
          _product: string
          _start: string
        }
        Returns: undefined
      }
      prune_check_data: { Args: never; Returns: undefined }
      record_receipt_diagnostic: {
        Args: {
          _code: string
          _detail: string
          _platform: string
          _stage: string
        }
        Returns: undefined
      }
      refund_check_quota: {
        Args: { _device: string; _period: string; _premium: boolean }
        Returns: undefined
      }
      revoke_entitlement: { Args: { _original: string }; Returns: undefined }
      settle_stale_checks: { Args: never; Returns: number }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
