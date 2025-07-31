export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      additional_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "additional_services_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_additional_services: {
        Row: {
          additional_service_id: string
          booking_id: string
          id: string
          quantity: number
          total_price: number | null
        }
        Insert: {
          additional_service_id: string
          booking_id: string
          id?: string
          quantity?: number
          total_price?: number | null
        }
        Update: {
          additional_service_id?: string
          booking_id?: string
          id?: string
          quantity?: number
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_additional_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_additional_service_id"
            columns: ["additional_service_id"]
            isOneToOne: false
            referencedRelation: "additional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_logs: {
        Row: {
          action: string | null
          action_type: string
          booking_id: string
          created_at: string | null
          id: string
          new_data: Json | null
          note: string | null
          old_data: Json | null
          performed_by: string
        }
        Insert: {
          action?: string | null
          action_type: string
          booking_id: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          performed_by: string
        }
        Update: {
          action?: string | null
          action_type?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          note?: string | null
          old_data?: Json | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_sessions: {
        Row: {
          additional_time_minutes: number | null
          booking_id: string
          created_at: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          additional_time_minutes?: number | null
          booking_id: string
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          additional_time_minutes?: number | null
          booking_id?: string
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          additional_time_minutes: number | null
          created_at: string
          end_time: string | null
          id: string
          is_walking_session: boolean
          notes: string | null
          package_category_id: string | null
          package_quantity: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          performed_by: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          studio_id: string | null
          studio_package_id: string
          total_amount: number | null
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_time_minutes?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_walking_session?: boolean
          notes?: string | null
          package_category_id?: string | null
          package_quantity?: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          performed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_id?: string | null
          studio_package_id: string
          total_amount?: number | null
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_time_minutes?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_walking_session?: boolean
          notes?: string | null
          package_category_id?: string | null
          package_quantity?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          performed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_id?: string | null
          studio_package_id?: string
          total_amount?: number | null
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_package_category_id_fkey"
            columns: ["package_category_id"]
            isOneToOne: false
            referencedRelation: "package_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_studio_package"
            columns: ["studio_package_id"]
            isOneToOne: false
            referencedRelation: "studio_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_order_services: {
        Row: {
          additional_service_id: string
          created_at: string
          custom_order_id: string
          id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          additional_service_id: string
          created_at?: string
          custom_order_id: string
          id?: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          additional_service_id?: string
          created_at?: string
          custom_order_id?: string
          id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_order_services_additional_service_id_fkey"
            columns: ["additional_service_id"]
            isOneToOne: false
            referencedRelation: "additional_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_order_services_custom_order_id_fkey"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_order_services_additional_service"
            columns: ["additional_service_id"]
            isOneToOne: false
            referencedRelation: "additional_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_order_services_additional_service_id"
            columns: ["additional_service_id"]
            isOneToOne: false
            referencedRelation: "additional_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_order_services_custom_order"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_order_services_custom_order_id"
            columns: ["custom_order_id"]
            isOneToOne: false
            referencedRelation: "custom_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          order_date: string
          payment_method: string
          status: string
          studio_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_method: string
          status?: string
          studio_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          order_date?: string
          payment_method?: string
          status?: string
          studio_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_orders_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_orders_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_orders_studio"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_orders_studio_id"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          note_file_path: string | null
          performed_by: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description?: string | null
          id?: string
          note_file_path?: string | null
          performed_by: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          note_file_path?: string | null
          performed_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          installment_number: number | null
          note: string | null
          paid_at: string
          payment_method: string | null
          performed_by: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          installment_number?: number | null
          note?: string | null
          paid_at?: string
          payment_method?: string | null
          performed_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          installment_number?: number | null
          note?: string | null
          paid_at?: string
          payment_method?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          month: number
          target_amount: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          month: number
          target_amount?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          month?: number
          target_amount?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_categories_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          api_key: string | null
          api_url: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          environment: Database["public"]["Enums"]["payment_environment"]
          id: string
          name: string
          public_key: string | null
          secret_key: string | null
          server_key: string | null
          status: Database["public"]["Enums"]["provider_status"]
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["payment_environment"]
          id?: string
          name: string
          public_key?: string | null
          secret_key?: string | null
          server_key?: string | null
          status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          environment?: Database["public"]["Enums"]["payment_environment"]
          id?: string
          name?: string
          public_key?: string | null
          secret_key?: string | null
          server_key?: string | null
          status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Relationships: []
      }
      studio_packages: {
        Row: {
          base_time_minutes: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          price: number
          studio_id: string
          title: string
          updated_at: string
        }
        Insert: {
          base_time_minutes: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price: number
          studio_id: string
          title: string
          updated_at?: string
        }
        Update: {
          base_time_minutes?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          studio_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "package_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_packages_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          type: Database["public"]["Enums"]["booking_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          type: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          type?: Database["public"]["Enums"]["booking_type"]
          updated_at?: string
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          changed_by_user_id: string
          from_status: Database["public"]["Enums"]["transaction_status"] | null
          id: string
          note: string | null
          timestamp: string
          to_status: Database["public"]["Enums"]["transaction_status"]
          transaction_id: string
        }
        Insert: {
          changed_by_user_id: string
          from_status?: Database["public"]["Enums"]["transaction_status"] | null
          id?: string
          note?: string | null
          timestamp?: string
          to_status: Database["public"]["Enums"]["transaction_status"]
          transaction_id: string
        }
        Update: {
          changed_by_user_id?: string
          from_status?: Database["public"]["Enums"]["transaction_status"] | null
          id?: string
          note?: string | null
          timestamp?: string
          to_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_logs_changed_by_user_id_fkey"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          description: string | null
          id: string
          payment_provider_id: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          performed_by: string | null
          reference_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_provider_id?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          performed_by?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_provider_id?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          performed_by?: string | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_provider_id_fkey"
            columns: ["payment_provider_id"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          password: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          password?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          password?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_booking_total: {
        Args: { booking_id_param: string }
        Returns: number
      }
      calculate_total_installments: {
        Args: { booking_id_param: string }
        Returns: number
      }
      check_booking_conflict: {
        Args: {
          studio_id_param: string
          start_time_param: string
          end_time_param: string
          exclude_booking_id?: string
        }
        Returns: boolean
      }
      get_booking_remaining_amount: {
        Args: { booking_id_param: string }
        Returns: number
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      login_user: {
        Args: { user_email: string; user_password: string }
        Returns: Json
      }
      register_user: {
        Args: {
          user_name: string
          user_email: string
          user_password: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: Json
      }
      verify_password: {
        Args: { password: string; hash: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "paid"
        | "expired"
        | "failed"
        | "installment"
      booking_type: "self_photo" | "regular"
      payment_environment: "sandbox" | "production"
      payment_method: "online" | "offline"
      payment_type: "online" | "offline" | "installment"
      provider_status: "active" | "inactive"
      transaction_status:
        | "paid"
        | "unpaid"
        | "expired"
        | "pending"
        | "settlement"
        | "failed"
      user_role: "owner" | "admin" | "keuangan" | "pelanggan"
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
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "paid",
        "expired",
        "failed",
        "installment",
      ],
      booking_type: ["self_photo", "regular"],
      payment_environment: ["sandbox", "production"],
      payment_method: ["online", "offline"],
      payment_type: ["online", "offline", "installment"],
      provider_status: ["active", "inactive"],
      transaction_status: [
        "paid",
        "unpaid",
        "expired",
        "pending",
        "settlement",
        "failed",
      ],
      user_role: ["owner", "admin", "keuangan", "pelanggan"],
    },
  },
} as const
