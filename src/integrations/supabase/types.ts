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
      admin_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          email: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          email: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      captcha_challenges: {
        Row: {
          answer: number
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          answer: number
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          answer?: number
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      customer_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automations: {
        Row: {
          automation_type: string
          created_at: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          schedule_cron: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          automation_type: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          schedule_cron?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          schedule_cron?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          lead_id: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          template_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      form_sessions: {
        Row: {
          completed: boolean
          current_step: number
          form_type: string
          id: string
          ip_address: string | null
          last_activity_at: string
          partial_data: Json | null
          session_id: string
          started_at: string
          total_steps: number
          user_agent: string | null
        }
        Insert: {
          completed?: boolean
          current_step?: number
          form_type: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          partial_data?: Json | null
          session_id: string
          started_at?: string
          total_steps: number
          user_agent?: string | null
        }
        Update: {
          completed?: boolean
          current_step?: number
          form_type?: string
          id?: string
          ip_address?: string | null
          last_activity_at?: string
          partial_data?: Json | null
          session_id?: string
          started_at?: string
          total_steps?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          lead_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          lead_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_sales_rep: string | null
          assigned_to: string | null
          business_name: string | null
          client_first_login_at: string | null
          client_password_hash: string | null
          created_at: string
          deal_amount: number | null
          deal_closed_at: string | null
          email: string
          form_data: Json
          id: string
          last_contacted_at: string | null
          lead_number: number | null
          name: string | null
          notes: string | null
          phone: string | null
          project_type: string
          status: Database["public"]["Enums"]["lead_status"]
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
        }
        Insert: {
          assigned_sales_rep?: string | null
          assigned_to?: string | null
          business_name?: string | null
          client_first_login_at?: string | null
          client_password_hash?: string | null
          created_at?: string
          deal_amount?: number | null
          deal_closed_at?: string | null
          email: string
          form_data: Json
          id?: string
          last_contacted_at?: string | null
          lead_number?: number | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type: string
          status?: Database["public"]["Enums"]["lead_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
        }
        Update: {
          assigned_sales_rep?: string | null
          assigned_to?: string | null
          business_name?: string | null
          client_first_login_at?: string | null
          client_password_hash?: string | null
          created_at?: string
          deal_amount?: number | null
          deal_closed_at?: string | null
          email?: string
          form_data?: Json
          id?: string
          last_contacted_at?: string | null
          lead_number?: number | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          project_type?: string
          status?: Database["public"]["Enums"]["lead_status"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          billing_interval: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      sales_metrics: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          lead_id: string | null
          metric_type: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metric_type: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metric_type?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_metrics_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          accent_color: string
          created_at: string
          created_by: string | null
          cta_link: string
          cta_text: string
          display_order: number
          features: string[]
          gradient_from: string
          gradient_to: string
          icon_name: string
          id: string
          is_active: boolean
          stat_label: string
          stat_value: string
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          created_by?: string | null
          cta_link: string
          cta_text: string
          display_order?: number
          features?: string[]
          gradient_from?: string
          gradient_to?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          stat_label: string
          stat_value: string
          tagline: string
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          created_by?: string | null
          cta_link?: string
          cta_text?: string
          display_order?: number
          features?: string[]
          gradient_from?: string
          gradient_to?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          stat_label?: string
          stat_value?: string
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          business_name: string
          created_at: string
          created_by: string | null
          delivery_time: string | null
          display_order: number
          id: string
          is_active: boolean
          metric_1_label: string | null
          metric_1_value: string | null
          metric_2_label: string | null
          metric_2_value: string | null
          project_type: string
          short_description: string
          show_on_homepage: boolean
          testimonial_author: string
          testimonial_role: string
          testimonial_text: string
          updated_at: string
          video_thumbnail: string | null
          video_url: string | null
          website_url: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          created_by?: string | null
          delivery_time?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metric_1_label?: string | null
          metric_1_value?: string | null
          metric_2_label?: string | null
          metric_2_value?: string | null
          project_type: string
          short_description: string
          show_on_homepage?: boolean
          testimonial_author: string
          testimonial_role: string
          testimonial_text: string
          updated_at?: string
          video_thumbnail?: string | null
          video_url?: string | null
          website_url?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          created_by?: string | null
          delivery_time?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          metric_1_label?: string | null
          metric_1_value?: string | null
          metric_2_label?: string | null
          metric_2_value?: string | null
          project_type?: string
          short_description?: string
          show_on_homepage?: boolean
          testimonial_author?: string
          testimonial_role?: string
          testimonial_text?: string
          updated_at?: string
          video_thumbnail?: string | null
          video_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string | null
          credit: number | null
          debit: number | null
          id: string
          invoice_status: string | null
          is_recurring: boolean
          item: string
          lead_id: string
          notes: string | null
          parent_transaction_id: string | null
          recurring_end_date: string | null
          recurring_interval: string | null
          status: string
          stripe_invoice_id: string | null
          transaction_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          invoice_status?: string | null
          is_recurring?: boolean
          item: string
          lead_id: string
          notes?: string | null
          parent_transaction_id?: string | null
          recurring_end_date?: string | null
          recurring_interval?: string | null
          status?: string
          stripe_invoice_id?: string | null
          transaction_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          invoice_status?: string | null
          is_recurring?: boolean
          item?: string
          lead_id?: string
          notes?: string | null
          parent_transaction_id?: string | null
          recurring_end_date?: string | null
          recurring_interval?: string | null
          status?: string
          stripe_invoice_id?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          can_charge_cards: boolean
          can_delete_leads: boolean
          can_edit_leads: boolean
          can_edit_project: boolean
          can_manage_users: boolean
          can_view: boolean
          can_view_payments: boolean
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_charge_cards?: boolean
          can_delete_leads?: boolean
          can_edit_leads?: boolean
          can_edit_project?: boolean
          can_manage_users?: boolean
          can_view?: boolean
          can_view_payments?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_charge_cards?: boolean
          can_delete_leads?: boolean
          can_edit_leads?: boolean
          can_edit_project?: boolean
          can_manage_users?: boolean
          can_view?: boolean
          can_view_payments?: boolean
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_charge_cards: { Args: { _user_id: string }; Returns: boolean }
      can_delete_leads: { Args: { _user_id: string }; Returns: boolean }
      can_edit_leads: { Args: { _user_id: string }; Returns: boolean }
      can_manage_users: { Args: { _user_id: string }; Returns: boolean }
      can_view_payments: { Args: { _user_id: string }; Returns: boolean }
      cleanup_expired_captchas: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer" | "developer" | "sales"
      lead_status: "new" | "contacted" | "booked_call" | "sold" | "lost"
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
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer", "developer", "sales"],
      lead_status: ["new", "contacted", "booked_call", "sold", "lost"],
    },
  },
} as const
