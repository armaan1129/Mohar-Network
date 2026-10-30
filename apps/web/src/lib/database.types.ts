export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          after: Json | null;
          at: string;
          before: Json | null;
          id: number;
          row_id: string | null;
          table_name: string | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_user_id?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          id?: never;
          row_id?: string | null;
          table_name?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          id?: never;
          row_id?: string | null;
          table_name?: string | null;
        };
        Relationships: [];
      };
      business_users: {
        Row: {
          business_id: string;
          created_at: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["business_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["business_role"];
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["business_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_users_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string;
          category_id: string;
          created_at: string;
          gstin: string | null;
          hours: string | null;
          id: string;
          issuance_cap_per_quarter: number | null;
          joined_at: string;
          lat: number | null;
          left_at: string | null;
          lng: number | null;
          logo_url: string | null;
          name: string;
          phone: string | null;
          status: Database["public"]["Enums"]["business_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address: string;
          category_id: string;
          created_at?: string;
          gstin?: string | null;
          hours?: string | null;
          id?: string;
          issuance_cap_per_quarter?: number | null;
          joined_at?: string;
          lat?: number | null;
          left_at?: string | null;
          lng?: number | null;
          logo_url?: string | null;
          name: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
        };
        Update: {
          address?: string;
          category_id?: string;
          created_at?: string;
          gstin?: string | null;
          hours?: string | null;
          id?: string;
          issuance_cap_per_quarter?: number | null;
          joined_at?: string;
          lat?: number | null;
          left_at?: string | null;
          lng?: number | null;
          logo_url?: string | null;
          name?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      cashier_scan_state: {
        Row: {
          consecutive_rejects: number;
          locked_until: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          consecutive_rejects?: number;
          locked_until?: string | null;
          user_id: string;
        };
        Update: {
          consecutive_rejects?: number;
          locked_until?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          name_pa: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          name_pa?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          name_pa?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          consent_marketing_at: string | null;
          consent_records_at: string | null;
          consent_text_version: string | null;
          created_at: string;
          erased_at: string | null;
          id: string;
          mobile_e164: string | null;
          mobile_sha256: string;
          name: string | null;
        };
        ComputedFields: never;
        Insert: {
          consent_marketing_at?: string | null;
          consent_records_at?: string | null;
          consent_text_version?: string | null;
          created_at?: string;
          erased_at?: string | null;
          id?: string;
          mobile_e164?: string | null;
          mobile_sha256: string;
          name?: string | null;
        };
        Update: {
          consent_marketing_at?: string | null;
          consent_records_at?: string | null;
          consent_text_version?: string | null;
          created_at?: string;
          erased_at?: string | null;
          id?: string;
          mobile_e164?: string | null;
          mobile_sha256?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      disputes: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          period_id: string;
          reason: string;
          redemption_id: string | null;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["dispute_status"];
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          period_id: string;
          reason: string;
          redemption_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          period_id?: string;
          reason?: string;
          redemption_id?: string | null;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["dispute_status"];
        };
        Relationships: [
          {
            foreignKeyName: "disputes_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "settlement_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "disputes_redemption_id_fkey";
            columns: ["redemption_id"];
            isOneToOne: false;
            referencedRelation: "redemptions";
            referencedColumns: ["id"];
          },
        ];
      };
      issuance_items: {
        Row: {
          face_paise: number;
          issuance_id: string;
          note_id: string;
        };
        ComputedFields: never;
        Insert: {
          face_paise: number;
          issuance_id: string;
          note_id: string;
        };
        Update: {
          face_paise?: number;
          issuance_id?: string;
          note_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issuance_items_issuance_id_fkey";
            columns: ["issuance_id"];
            isOneToOne: false;
            referencedRelation: "issuances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issuance_items_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: true;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      issuances: {
        Row: {
          bill_amount_paise: number;
          bill_ref: string;
          business_date: string;
          business_id: string;
          cashier_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          idempotency_key: string;
          notes_count: number;
          request_hash: string;
        };
        ComputedFields: never;
        Insert: {
          bill_amount_paise: number;
          bill_ref: string;
          business_date?: string;
          business_id: string;
          cashier_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          idempotency_key: string;
          notes_count: number;
          request_hash: string;
        };
        Update: {
          bill_amount_paise?: number;
          bill_ref?: string;
          business_date?: string;
          business_id?: string;
          cashier_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          idempotency_key?: string;
          notes_count?: number;
          request_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issuances_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issuances_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      network_settings: {
        Row: {
          consent_text_version: string;
          earn_base_notes: number;
          earn_min_bill_paise: number;
          earn_on_bills_with_redemption: boolean;
          earn_step_paise: number;
          factor_cap: number;
          factor_floor: number;
          id: number;
          low_stock_pct: number;
          network_fee_bps: number;
          note_face_paise: number;
          redeem_cap_bps: number;
          redeem_otp: boolean;
          require_mobile_match: boolean;
          scan_lockout_seconds: number;
          scan_lockout_threshold: number;
          settlement_k: number;
          suspension_grace_days: number;
          updated_at: string;
          validity_months: number;
        };
        ComputedFields: never;
        Insert: {
          consent_text_version?: string;
          earn_base_notes?: number;
          earn_min_bill_paise?: number;
          earn_on_bills_with_redemption?: boolean;
          earn_step_paise?: number;
          factor_cap?: number;
          factor_floor?: number;
          id?: number;
          low_stock_pct?: number;
          network_fee_bps?: number;
          note_face_paise?: number;
          redeem_cap_bps?: number;
          redeem_otp?: boolean;
          require_mobile_match?: boolean;
          scan_lockout_seconds?: number;
          scan_lockout_threshold?: number;
          settlement_k?: number;
          suspension_grace_days?: number;
          updated_at?: string;
          validity_months?: number;
        };
        Update: {
          consent_text_version?: string;
          earn_base_notes?: number;
          earn_min_bill_paise?: number;
          earn_on_bills_with_redemption?: boolean;
          earn_step_paise?: number;
          factor_cap?: number;
          factor_floor?: number;
          id?: number;
          low_stock_pct?: number;
          network_fee_bps?: number;
          note_face_paise?: number;
          redeem_cap_bps?: number;
          redeem_otp?: boolean;
          require_mobile_match?: boolean;
          scan_lockout_seconds?: number;
          scan_lockout_threshold?: number;
          settlement_k?: number;
          suspension_grace_days?: number;
          updated_at?: string;
          validity_months?: number;
        };
        Relationships: [];
      };
      note_allocations: {
        Row: {
          allocated_at: string;
          allocated_by: string | null;
          batch_id: string;
          business_id: string;
          first_seq: number;
          id: string;
          last_seq: number;
          stack_index: number | null;
        };
        ComputedFields: never;
        Insert: {
          allocated_at?: string;
          allocated_by?: string | null;
          batch_id: string;
          business_id: string;
          first_seq: number;
          id?: string;
          last_seq: number;
          stack_index?: number | null;
        };
        Update: {
          allocated_at?: string;
          allocated_by?: string | null;
          batch_id?: string;
          business_id?: string;
          first_seq?: number;
          id?: string;
          last_seq?: number;
          stack_index?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "note_allocations_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "note_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_allocations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      note_batches: {
        Row: {
          created_at: string;
          created_by: string | null;
          first_seq: number;
          id: string;
          last_seq: number;
          notes: string | null;
          printed_at: string;
          series: string;
          stack_size: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          first_seq: number;
          id?: string;
          last_seq: number;
          notes?: string | null;
          printed_at: string;
          series: string;
          stack_size: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          first_seq?: number;
          id?: string;
          last_seq?: number;
          notes?: string | null;
          printed_at?: string;
          series?: string;
          stack_size?: number;
        };
        Relationships: [];
      };
      note_events: {
        Row: {
          actor_user_id: string | null;
          at: string;
          business_id: string | null;
          id: number;
          note_id: string;
          payload: NonNullable<Json>;
          type: string;
        };
        ComputedFields: never;
        Insert: {
          actor_user_id?: string | null;
          at?: string;
          business_id?: string | null;
          id?: never;
          note_id: string;
          payload?: NonNullable<Json>;
          type: string;
        };
        Update: {
          actor_user_id?: string | null;
          at?: string;
          business_id?: string | null;
          id?: never;
          note_id?: string;
          payload?: NonNullable<Json>;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_events_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          allocated_business_id: string | null;
          allocation_id: string | null;
          batch_id: string;
          customer_id: string | null;
          expires_at: string | null;
          id: string;
          issuance_id: string | null;
          issued_at: string | null;
          issued_business_id: string | null;
          redeemed_at: string | null;
          redemption_id: string | null;
          seq: number;
          serial: string | null;
          series: string;
          status: Database["public"]["Enums"]["note_status"];
          updated_at: string;
          void_reason: string | null;
          voided_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          allocated_business_id?: string | null;
          allocation_id?: string | null;
          batch_id: string;
          customer_id?: string | null;
          expires_at?: string | null;
          id?: string;
          issuance_id?: string | null;
          issued_at?: string | null;
          issued_business_id?: string | null;
          redeemed_at?: string | null;
          redemption_id?: string | null;
          seq: number;
          serial?: never;
          series: string;
          status?: Database["public"]["Enums"]["note_status"];
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
        };
        Update: {
          allocated_business_id?: string | null;
          allocation_id?: string | null;
          batch_id?: string;
          customer_id?: string | null;
          expires_at?: string | null;
          id?: string;
          issuance_id?: string | null;
          issued_at?: string | null;
          issued_business_id?: string | null;
          redeemed_at?: string | null;
          redemption_id?: string | null;
          seq?: number;
          serial?: never;
          series?: string;
          status?: Database["public"]["Enums"]["note_status"];
          updated_at?: string;
          void_reason?: string | null;
          voided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_allocated_business_id_fkey";
            columns: ["allocated_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_allocation_id_fkey";
            columns: ["allocation_id"];
            isOneToOne: false;
            referencedRelation: "note_allocations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "note_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_issuance_id_fkey";
            columns: ["issuance_id"];
            isOneToOne: false;
            referencedRelation: "issuances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_issued_business_id_fkey";
            columns: ["issued_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_redemption_id_fkey";
            columns: ["redemption_id"];
            isOneToOne: false;
            referencedRelation: "redemptions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          role: Database["public"]["Enums"]["profile_role"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          bucket: string;
          hits: number;
          user_id: string;
          window_start: string;
        };
        ComputedFields: never;
        Insert: {
          bucket: string;
          hits?: number;
          user_id: string;
          window_start: string;
        };
        Update: {
          bucket?: string;
          hits?: number;
          user_id?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      redemption_items: {
        Row: {
          face_paise: number;
          is_self: boolean;
          issuer_business_id: string;
          note_id: string;
          redemption_id: string;
        };
        ComputedFields: never;
        Insert: {
          face_paise: number;
          is_self: boolean;
          issuer_business_id: string;
          note_id: string;
          redemption_id: string;
        };
        Update: {
          face_paise?: number;
          is_self?: boolean;
          issuer_business_id?: string;
          note_id?: string;
          redemption_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redemption_items_issuer_business_id_fkey";
            columns: ["issuer_business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemption_items_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: true;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemption_items_redemption_id_fkey";
            columns: ["redemption_id"];
            isOneToOne: false;
            referencedRelation: "redemptions";
            referencedColumns: ["id"];
          },
        ];
      };
      redemptions: {
        Row: {
          bill_amount_paise: number;
          bill_ref: string;
          business_date: string;
          business_id: string;
          cashier_id: string;
          created_at: string;
          customer_id: string;
          discount_paise: number;
          id: string;
          idempotency_key: string;
          no_other_offer_confirmed: boolean;
          request_hash: string;
        };
        ComputedFields: never;
        Insert: {
          bill_amount_paise: number;
          bill_ref: string;
          business_date?: string;
          business_id: string;
          cashier_id: string;
          created_at?: string;
          customer_id: string;
          discount_paise: number;
          id?: string;
          idempotency_key: string;
          no_other_offer_confirmed: boolean;
          request_hash: string;
        };
        Update: {
          bill_amount_paise?: number;
          bill_ref?: string;
          business_date?: string;
          business_id?: string;
          cashier_id?: string;
          created_at?: string;
          customer_id?: string;
          discount_paise?: number;
          id?: string;
          idempotency_key?: string;
          no_other_offer_confirmed?: boolean;
          request_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "redemptions_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_rejections: {
        Row: {
          at: string;
          business_id: string | null;
          id: number;
          mode: string;
          reason: string;
          serial: string | null;
          serial_raw: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          at?: string;
          business_id?: string | null;
          id?: never;
          mode: string;
          reason: string;
          serial?: string | null;
          serial_raw: string;
          user_id: string;
        };
        Update: {
          at?: string;
          business_id?: string | null;
          id?: never;
          mode?: string;
          reason?: string;
          serial?: string | null;
          serial_raw?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scan_rejections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      settlement_lines: {
        Row: {
          business_id: string;
          created_at: string;
          factor: number | null;
          fee_paise: number;
          id: string;
          inbound_bill_paise: number;
          inbound_face_paise: number;
          net_paise: number;
          outbound_owed_paise: number;
          paid_at: string | null;
          payment_ref: string | null;
          payout_paise: number;
          period_id: string;
          ratio: number | null;
          self_redeemed_face_paise: number;
          statement_path: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          factor?: number | null;
          fee_paise?: number;
          id?: string;
          inbound_bill_paise?: number;
          inbound_face_paise?: number;
          net_paise?: number;
          outbound_owed_paise?: number;
          paid_at?: string | null;
          payment_ref?: string | null;
          payout_paise?: number;
          period_id: string;
          ratio?: number | null;
          self_redeemed_face_paise?: number;
          statement_path?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          factor?: number | null;
          fee_paise?: number;
          id?: string;
          inbound_bill_paise?: number;
          inbound_face_paise?: number;
          net_paise?: number;
          outbound_owed_paise?: number;
          paid_at?: string | null;
          payment_ref?: string | null;
          payout_paise?: number;
          period_id?: string;
          ratio?: number | null;
          self_redeemed_face_paise?: number;
          statement_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settlement_lines_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_lines_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "settlement_periods";
            referencedColumns: ["id"];
          },
        ];
      };
      settlement_periods: {
        Row: {
          created_at: string;
          draft_at: string | null;
          final_at: string | null;
          id: string;
          network_ratio: number | null;
          pool_paise: number | null;
          quarter_end: string;
          quarter_start: string;
          status: Database["public"]["Enums"]["settlement_status"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          draft_at?: string | null;
          final_at?: string | null;
          id?: string;
          network_ratio?: number | null;
          pool_paise?: number | null;
          quarter_end: string;
          quarter_start: string;
          status?: Database["public"]["Enums"]["settlement_status"];
        };
        Update: {
          created_at?: string;
          draft_at?: string | null;
          final_at?: string | null;
          id?: string;
          network_ratio?: number | null;
          pool_paise?: number | null;
          quarter_end?: string;
          quarter_start?: string;
          status?: Database["public"]["Enums"]["settlement_status"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      directory: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string;
          category_id: string;
          category_name: string;
          category_name_pa: string;
          hours: string;
          id: string;
          lat: number;
          lng: number;
          logo_url: string;
          name: string;
          phone: string;
        }[];
      };
    };
    Enums: {
      business_role: "owner" | "cashier";
      business_status: "active" | "suspended" | "left";
      dispute_status: "open" | "upheld" | "rejected" | "withdrawn";
      note_status: "printed" | "allocated" | "issued" | "redeemed" | "expired" | "void";
      profile_role: "member" | "network_admin";
      settlement_status: "open" | "draft" | "disputes" | "final" | "paid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      business_role: ["owner", "cashier"],
      business_status: ["active", "suspended", "left"],
      dispute_status: ["open", "upheld", "rejected", "withdrawn"],
      note_status: ["printed", "allocated", "issued", "redeemed", "expired", "void"],
      profile_role: ["member", "network_admin"],
      settlement_status: ["open", "draft", "disputes", "final", "paid"],
    },
  },
} as const;
