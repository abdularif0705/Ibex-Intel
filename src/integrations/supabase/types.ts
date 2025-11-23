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
      report_subscriptions: {
        Row: {
          audience: Database["public"]["Enums"]["report_audience"] | null
          company_filters: string[] | null
          created_at: string | null
          custom_monitor_urls: string[] | null
          email: string
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          min_confidence_score: number | null
          report_name: string | null
          signal_types: Database["public"]["Enums"]["signal_type"][] | null
          source_filters: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["report_audience"] | null
          company_filters?: string[] | null
          created_at?: string | null
          custom_monitor_urls?: string[] | null
          email: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          min_confidence_score?: number | null
          report_name?: string | null
          signal_types?: Database["public"]["Enums"]["signal_type"][] | null
          source_filters?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["report_audience"] | null
          company_filters?: string[] | null
          created_at?: string | null
          custom_monitor_urls?: string[] | null
          email?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          min_confidence_score?: number | null
          report_name?: string | null
          signal_types?: Database["public"]["Enums"]["signal_type"][] | null
          source_filters?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_scans: {
        Row: {
          created_at: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          source_types: Database["public"]["Enums"]["source_type"][]
          target_urls: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          source_types: Database["public"]["Enums"]["source_type"][]
          target_urls: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          source_types?: Database["public"]["Enums"]["source_type"][]
          target_urls?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          results_count: number | null
          source_type: Database["public"]["Enums"]["source_type"]
          started_at: string | null
          status: string | null
          target_url: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          results_count?: number | null
          source_type: Database["public"]["Enums"]["source_type"]
          started_at?: string | null
          status?: string | null
          target_url: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          results_count?: number | null
          source_type?: Database["public"]["Enums"]["source_type"]
          started_at?: string | null
          status?: string | null
          target_url?: string
          user_id?: string
        }
        Relationships: []
      }
      signal_evidence: {
        Row: {
          created_at: string | null
          evidence_text: string | null
          evidence_type: string
          id: string
          relevance_score: number | null
          signal_id: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_text?: string | null
          evidence_type: string
          id?: string
          relevance_score?: number | null
          signal_id?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          evidence_text?: string | null
          evidence_type?: string
          id?: string
          relevance_score?: number | null
          signal_id?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_evidence_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          company_name: string
          company_ticker: string | null
          confidence_score: number | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string | null
          detected_at: string | null
          extracted_data: Json | null
          id: string
          keywords: string[] | null
          raw_content: string | null
          scan_type: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          company_ticker?: string | null
          confidence_score?: number | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string | null
          detected_at?: string | null
          extracted_data?: Json | null
          id?: string
          keywords?: string[] | null
          raw_content?: string | null
          scan_type?: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          company_ticker?: string | null
          confidence_score?: number | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string | null
          detected_at?: string | null
          extracted_data?: Json | null
          id?: string
          keywords?: string[] | null
          raw_content?: string | null
          scan_type?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          asset_class: string | null
          coverage_group: string | null
          created_at: string | null
          id: string
          market_segment: string | null
          onboarding_completed: boolean | null
          other_details: Json | null
          professional_role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          coverage_group?: string | null
          created_at?: string | null
          id?: string
          market_segment?: string | null
          onboarding_completed?: boolean | null
          other_details?: Json | null
          professional_role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_class?: string | null
          coverage_group?: string | null
          created_at?: string | null
          id?: string
          market_segment?: string | null
          onboarding_completed?: boolean | null
          other_details?: Json | null
          professional_role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_scan_limits: {
        Row: {
          created_at: string
          id: string
          plan_type: string
          scan_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_type?: string
          scan_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_type?: string
          scan_count?: number
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
      get_user_subscriptions: {
        Args: never
        Returns: {
          audience: Database["public"]["Enums"]["report_audience"]
          company_filters: string[]
          created_at: string
          custom_monitor_urls: string[]
          frequency: string
          id: string
          is_active: boolean
          last_sent_at: string
          min_confidence_score: number
          report_name: string
          signal_types: string[]
          source_filters: string[]
          updated_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      content_type:
        | "webpage_text"
        | "blog_post"
        | "press_release"
        | "job_posting"
        | "video"
        | "image"
        | "pdf_document"
        | "news_article"
        | "social_media_post"
        | "forum_post"
        | "company_announcement"
      report_audience: "executive" | "analyst" | "technical"
      signal_type:
        | "erp_transformation"
        | "crm_implementation"
        | "infrastructure_modernization"
        | "digital_transformation"
        | "cloud_migration"
        | "data_analytics"
        | "cybersecurity_upgrade"
      source_type:
        | "linkedin"
        | "reddit"
        | "fishbowl"
        | "teamblind"
        | "hackernews"
        | "glassdoor"
        | "facebook"
        | "monster"
        | "indeed"
        | "levels"
        | "sec_edgar"
        | "gov_finance"
        | "news_site"
        | "seeking_alpha"
        | "twitter"
        | "company_website"
        | "pr_wire"
        | "employee_profile"
        | "headhunter"
        | "recruiting_site"
        | "ashby"
        | "greenhouse"
        | "clay"
        | "levels_fyi"
        | "teksystems"
        | "toptal"
        | "adecco_group"
        | "blog"
        | "prnewswire"
        | "other"
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
      content_type: [
        "webpage_text",
        "blog_post",
        "press_release",
        "job_posting",
        "video",
        "image",
        "pdf_document",
        "news_article",
        "social_media_post",
        "forum_post",
        "company_announcement",
      ],
      report_audience: ["executive", "analyst", "technical"],
      signal_type: [
        "erp_transformation",
        "crm_implementation",
        "infrastructure_modernization",
        "digital_transformation",
        "cloud_migration",
        "data_analytics",
        "cybersecurity_upgrade",
      ],
      source_type: [
        "linkedin",
        "reddit",
        "fishbowl",
        "teamblind",
        "hackernews",
        "glassdoor",
        "facebook",
        "monster",
        "indeed",
        "levels",
        "sec_edgar",
        "gov_finance",
        "news_site",
        "seeking_alpha",
        "twitter",
        "company_website",
        "pr_wire",
        "employee_profile",
        "headhunter",
        "recruiting_site",
        "ashby",
        "greenhouse",
        "clay",
        "levels_fyi",
        "teksystems",
        "toptal",
        "adecco_group",
        "blog",
        "prnewswire",
        "other",
      ],
    },
  },
} as const
