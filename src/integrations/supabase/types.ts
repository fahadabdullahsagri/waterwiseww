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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_events: {
        Row: {
          action: string
          agent: string
          alert_id: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          confidence: number
          created_at: string
          decision: string
          id: string
          memory: string
          perception: Json
          reasoning_summary: string
          requires_human_approval: boolean
          trigger: string
        }
        Insert: {
          action: string
          agent: string
          alert_id?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision?: string
          id?: string
          memory: string
          perception?: Json
          reasoning_summary: string
          requires_human_approval?: boolean
          trigger: string
        }
        Update: {
          action?: string
          agent?: string
          alert_id?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence?: number
          created_at?: string
          decision?: string
          id?: string
          memory?: string
          perception?: Json
          reasoning_summary?: string
          requires_human_approval?: boolean
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          confidence: number
          created_at: string
          drought_weight: number
          est_litres_per_hour: number
          eta: string | null
          id: string
          is_true_leak: boolean | null
          priority_score: number
          sensor_id: string | null
          severity: string
          source: string
          status: string
          title: string
          updated_at: string
          ward_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          drought_weight?: number
          est_litres_per_hour?: number
          eta?: string | null
          id?: string
          is_true_leak?: boolean | null
          priority_score?: number
          sensor_id?: string | null
          severity?: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          ward_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          drought_weight?: number
          est_litres_per_hour?: number
          eta?: string | null
          id?: string
          is_true_leak?: boolean | null
          priority_score?: number
          sensor_id?: string | null
          severity?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      citizen_reports: {
        Row: {
          alert_id: string | null
          created_at: string
          deduped: boolean
          id: string
          intent: string
          message: string
          photo_url: string | null
          reply: string | null
          ward_id: string | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          deduped?: boolean
          id?: string
          intent?: string
          message: string
          photo_url?: string | null
          reply?: string | null
          ward_id?: string | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          deduped?: boolean
          id?: string
          intent?: string
          message?: string
          photo_url?: string | null
          reply?: string | null
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citizen_reports_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citizen_reports_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      irrigation_districts: {
        Row: {
          created_at: string
          crop: string
          fixed_baseline_mm: number
          id: string
          lat: number
          lng: number
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          crop?: string
          fixed_baseline_mm?: number
          id?: string
          lat: number
          lng: number
          name: string
          state: string
        }
        Update: {
          created_at?: string
          crop?: string
          fixed_baseline_mm?: number
          id?: string
          lat?: number
          lng?: number
          name?: string
          state?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          alert_id: string | null
          body: string
          channel: string
          created_at: string
          id: string
          ward_id: string
        }
        Insert: {
          alert_id?: string | null
          body: string
          channel?: string
          created_at?: string
          id?: string
          ward_id: string
        }
        Update: {
          alert_id?: string | null
          body?: string
          channel?: string
          created_at?: string
          id?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      nrw_history: {
        Row: {
          id: string
          litres_saved: number
          month: string
          nrw_percent: number
        }
        Insert: {
          id?: string
          litres_saved?: number
          month: string
          nrw_percent: number
        }
        Update: {
          id?: string
          litres_saved?: number
          month?: string
          nrw_percent?: number
        }
        Relationships: []
      }
      pilot_requests: {
        Row: {
          city: string | null
          connections: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          organisation: string
          role: string | null
          tier: string
        }
        Insert: {
          city?: string | null
          connections?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          organisation: string
          role?: string | null
          tier?: string
        }
        Update: {
          city?: string | null
          connections?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          organisation?: string
          role?: string | null
          tier?: string
        }
        Relationships: []
      }
      readings: {
        Row: {
          acoustic_score: number
          flow_lpm: number
          id: number
          is_injected_leak: boolean
          pressure_bar: number
          recorded_at: string
          sensor_id: string
        }
        Insert: {
          acoustic_score: number
          flow_lpm: number
          id?: number
          is_injected_leak?: boolean
          pressure_bar: number
          recorded_at?: string
          sensor_id: string
        }
        Update: {
          acoustic_score?: number
          flow_lpm?: number
          id?: number
          is_injected_leak?: boolean
          pressure_bar?: number
          recorded_at?: string
          sensor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readings_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      sensors: {
        Row: {
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          pipe_age_years: number
          pipe_diameter_mm: number
          status: string
          ward_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          pipe_age_years?: number
          pipe_diameter_mm?: number
          status?: string
          ward_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          pipe_age_years?: number
          pipe_diameter_mm?: number
          status?: string
          ward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensors_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      wards: {
        Row: {
          code: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          population: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          population: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          population?: number
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          alert_id: string
          created_at: string
          crew: string
          id: string
          queue_position: number
          status: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          crew?: string
          id?: string
          queue_position?: number
          status?: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          crew?: string
          id?: string
          queue_position?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
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
