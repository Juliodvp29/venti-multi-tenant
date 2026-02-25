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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          category_id: string | null
          created_at: string | null
          customer_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          page_url: string | null
          product_id: string | null
          referrer: string | null
          session_id: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          page_url?: string | null
          product_id?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "analytics_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          company: string | null
          country: string
          created_at: string | null
          customer_id: string
          first_name: string
          id: string
          is_billing_default: boolean | null
          is_default: boolean | null
          label: string | null
          last_name: string
          phone: string | null
          postal_code: string
          state: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          company?: string | null
          country: string
          created_at?: string | null
          customer_id: string
          first_name: string
          id?: string
          is_billing_default?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last_name: string
          phone?: string | null
          postal_code: string
          state?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          company?: string | null
          country?: string
          created_at?: string | null
          customer_id?: string
          first_name?: string
          id?: string
          is_billing_default?: boolean | null
          is_default?: boolean | null
          label?: string | null
          last_name?: string
          phone?: string | null
          postal_code?: string
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          accepts_marketing: boolean | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          tenant_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          tenant_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepts_marketing?: boolean | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          tenant_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales_summary: {
        Row: {
          average_order_value: number | null
          created_at: string | null
          date: string
          id: string
          new_customers: number | null
          returning_customers: number | null
          tenant_id: string
          total_items_sold: number | null
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_customers?: number | null
          returning_customers?: number | null
          tenant_id: string
          total_items_sold?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_customers?: number | null
          returning_customers?: number | null
          tenant_id?: string
          total_items_sold?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_summary_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to_categories: string[] | null
          applies_to_products: string[] | null
          code: string
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          minimum_purchase_amount: number | null
          per_customer_limit: number | null
          starts_at: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          code: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_purchase_amount?: number | null
          per_customer_limit?: number | null
          starts_at?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          code?: string
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          minimum_purchase_amount?: number | null
          per_customer_limit?: number | null
          starts_at?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_usage: {
        Row: {
          created_at: string | null
          customer_id: string
          discount_amount: number
          discount_code_id: string
          id: string
          order_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          discount_amount: number
          discount_code_id: string
          id?: string
          order_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          discount_amount?: number
          discount_code_id?: string
          id?: string
          order_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "vw_active_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          provider: string | null
          provider_message_id: string | null
          recipient_email: string
          related_customer_id: string | null
          related_order_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_key: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient_email: string
          related_customer_id?: string | null
          related_order_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_key?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          related_customer_id?: string | null
          related_order_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_key?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: Json | null
          body_html: string
          body_text: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_key: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          available_variables?: Json | null
          body_html: string
          body_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_key: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          available_variables?: Json | null
          body_html?: string
          body_text?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_key?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string | null
          file_path: string
          file_size: number
          file_url: string
          filename: string
          folder: string | null
          height: number | null
          id: string
          mime_type: string
          original_filename: string
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
          uploaded_by: string | null
          used_in: Json | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          file_path: string
          file_size: number
          file_url: string
          filename: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type: string
          original_filename: string
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
          uploaded_by?: string | null
          used_in?: Json | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          file_path?: string
          file_size?: number
          file_url?: string
          filename?: string
          folder?: string | null
          height?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
          used_in?: Json | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          product_snapshot: Json | null
          quantity: number
          tax_amount: number | null
          tenant_id: string
          total_amount: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity: number
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          product_snapshot?: Json | null
          quantity?: number
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          customer_notified: boolean | null
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
          tenant_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
          tenant_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          customer_notified?: boolean | null
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_company: string | null
          billing_country: string | null
          billing_first_name: string | null
          billing_last_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          billing_state: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string | null
          currency: string
          customer_email: string
          customer_first_name: string | null
          customer_id: string
          customer_last_name: string | null
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string
          internal_note: string | null
          ip_address: unknown
          order_number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipped_at: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_company: string | null
          shipping_country: string | null
          shipping_first_name: string | null
          shipping_last_name: string | null
          shipping_method: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number | null
          tenant_id: string
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_company?: string | null
          billing_country?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_first_name?: string | null
          customer_id: string
          customer_last_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          internal_note?: string | null
          ip_address?: unknown
          order_number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipped_at?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_company?: string | null
          shipping_country?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_method?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount?: number | null
          tenant_id: string
          total_amount: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_company?: string | null
          billing_country?: string | null
          billing_first_name?: string | null
          billing_last_name?: string | null
          billing_phone?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_first_name?: string | null
          customer_id?: string
          customer_last_name?: string | null
          customer_note?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          id?: string
          internal_note?: string | null
          ip_address?: unknown
          order_number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipped_at?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_amount?: number | null
          shipping_city?: string | null
          shipping_company?: string | null
          shipping_country?: string | null
          shipping_first_name?: string | null
          shipping_last_name?: string | null
          shipping_method?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          tenant_id?: string
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          gateway: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          order_id: string
          payment_details: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          gateway?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          order_id: string
          payment_details?: Json | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          gateway?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          order_id?: string
          payment_details?: Json | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          processed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string | null
          product_id: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          product_id: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          height: number | null
          id: string
          is_primary: boolean | null
          product_id: string
          size_bytes: number | null
          sort_order: number | null
          tenant_id: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          product_id: string
          size_bytes?: number | null
          sort_order?: number | null
          tenant_id: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
          size_bytes?: number | null
          sort_order?: number | null
          tenant_id?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_performance: {
        Row: {
          add_to_cart: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          product_id: string
          purchases: number | null
          revenue: number | null
          tenant_id: string
          units_sold: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          add_to_cart?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          product_id: string
          purchases?: number | null
          revenue?: number | null
          tenant_id: string
          units_sold?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          add_to_cart?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          product_id?: string
          purchases?: number | null
          revenue?: number | null
          tenant_id?: string
          units_sold?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_performance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_id: string
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          order_id: string | null
          product_id: string
          rating: number
          review: string | null
          status: Database["public"]["Enums"]["review_status"]
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id: string
          rating: number
          review?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          order_id?: string | null
          product_id?: string
          rating?: number
          review?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_associations: {
        Row: {
          created_at: string | null
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_associations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_tag_associations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          options: Json
          price: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          options: Json
          price?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          options?: Json
          price?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          is_featured: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string
          price: number
          published_at: string | null
          short_description: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number | null
          tenant_id: string
          track_inventory: boolean | null
          updated_at: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          allow_backorder?: boolean | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name: string
          price: number
          published_at?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          tenant_id: string
          track_inventory?: boolean | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          allow_backorder?: boolean | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string
          price?: number
          published_at?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          tenant_id?: string
          track_inventory?: boolean | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string | null
          gateway_refund_id: string | null
          id: string
          order_id: string
          payment_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          order_id: string
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gateway_refund_id?: string | null
          id?: string
          order_id?: string
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_orders_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vw_recent_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          is_active: boolean | null
          max_order_amount: number | null
          max_weight: number | null
          min_order_amount: number | null
          min_weight: number | null
          name: string
          rate_amount: number
          rate_type: string
          shipping_zone_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name: string
          rate_amount: number
          rate_type: string
          shipping_zone_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name?: string
          rate_amount?: number
          rate_type?: string
          shipping_zone_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          countries: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_codes: string[] | null
          states: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          countries?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_codes?: string[] | null
          states?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          countries?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_codes?: string[] | null
          states?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_method: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Update: {
          amount?: number | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_codes: string[] | null
          rate: number
          state: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_codes?: string[] | null
          rate: number
          state?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_codes?: string[] | null
          rate?: number
          state?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          address_line1: string | null
          address_line2: string | null
          business_name: string
          city: string | null
          contact_email: string
          contact_phone: string | null
          country: string | null
          created_at: string | null
          custom_domain: string | null
          deleted_at: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          is_verified: boolean | null
          layout: string | null
          logo_url: string | null
          owner_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_status: Database["public"]["Enums"]["subscription_status"]
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          subscription_ends_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          is_verified?: boolean | null
          layout?: string | null
          logo_url?: string | null
          owner_id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_status?: Database["public"]["Enums"]["subscription_status"]
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          custom_domain?: string | null
          deleted_at?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          is_verified?: boolean | null
          layout?: string | null
          logo_url?: string | null
          owner_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_status?: Database["public"]["Enums"]["subscription_status"]
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          subdomain?: string
          subscription_ends_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          http_status_code: number | null
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          status: string | null
          tenant_id: string
          webhook_endpoint_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          http_status_code?: number | null
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          status?: string | null
          tenant_id: string
          webhook_endpoint_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          http_status_code?: number | null
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string | null
          tenant_id?: string
          webhook_endpoint_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_endpoint_id_fkey"
            columns: ["webhook_endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          secret_key: string
          subscribed_events: string[]
          tenant_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          secret_key: string
          subscribed_events: string[]
          tenant_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          secret_key?: string
          subscribed_events?: string[]
          tenant_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_active_discounts: {
        Row: {
          applies_to_categories: string[] | null
          applies_to_products: string[] | null
          code: string | null
          created_at: string | null
          description: string | null
          discount_status: string | null
          ends_at: string | null
          id: string | null
          is_active: boolean | null
          minimum_purchase_amount: number | null
          per_customer_limit: number | null
          remaining_uses: number | null
          starts_at: string | null
          tenant_id: string | null
          times_used: number | null
          total_discount_given: number | null
          type: Database["public"]["Enums"]["discount_type"] | null
          unique_customers: number | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          value: number | null
        }
        Insert: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount_status?: never
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          minimum_purchase_amount?: number | null
          per_customer_limit?: number | null
          remaining_uses?: never
          starts_at?: string | null
          tenant_id?: string | null
          times_used?: never
          total_discount_given?: never
          type?: Database["public"]["Enums"]["discount_type"] | null
          unique_customers?: never
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: number | null
        }
        Update: {
          applies_to_categories?: string[] | null
          applies_to_products?: string[] | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount_status?: never
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          minimum_purchase_amount?: number | null
          per_customer_limit?: number | null
          remaining_uses?: never
          starts_at?: string | null
          tenant_id?: string | null
          times_used?: never
          total_discount_given?: never
          type?: Database["public"]["Enums"]["discount_type"] | null
          unique_customers?: never
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_customer_analytics: {
        Row: {
          accepts_marketing: boolean | null
          average_order_value: number | null
          created_at: string | null
          customer_segment: string | null
          days_since_last_order: number | null
          email: string | null
          first_name: string | null
          first_order_date: string | null
          id: string | null
          last_name: string | null
          last_order_date: string | null
          lifetime_orders: number | null
          lifetime_value: number | null
          phone: string | null
          reviews_count: number | null
          tenant_id: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_daily_dashboard: {
        Row: {
          avg_order_value_30d: number | null
          last_month_orders: number | null
          last_month_revenue: number | null
          month_orders: number | null
          month_revenue: number | null
          tenant_id: string | null
          today_orders: number | null
          today_revenue: number | null
          week_orders: number | null
          week_revenue: number | null
          yesterday_orders: number | null
          yesterday_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_daily_sales_realtime: {
        Row: {
          average_order_value: number | null
          date: string | null
          tenant_id: string | null
          total_items_sold: number | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_low_stock_alerts: {
        Row: {
          average_daily_sales: number | null
          days_of_stock_remaining: number | null
          id: string | null
          image_url: string | null
          low_stock_threshold: number | null
          name: string | null
          sales_last_30_days: number | null
          sku: string | null
          stock_quantity: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_orders_complete: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_company: string | null
          billing_country: string | null
          billing_first_name: string | null
          billing_last_name: string | null
          billing_phone: string | null
          billing_postal_code: string | null
          billing_state: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_id: string | null
          customer_last_name: string | null
          customer_note: string | null
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number | null
          id: string | null
          internal_note: string | null
          ip_address: unknown
          item_count: number | null
          items: Json | null
          order_number: string | null
          payment_info: Json | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          shipped_at: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_amount: number | null
          shipping_city: string | null
          shipping_company: string | null
          shipping_country: string | null
          shipping_first_name: string | null
          shipping_last_name: string | null
          shipping_method: string | null
          shipping_phone: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          tax_amount: number | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_slug: string | null
          total_amount: number | null
          total_items: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "vw_customer_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_product_performance_realtime: {
        Row: {
          product_id: string | null
          purchases: number | null
          revenue: number | null
          tenant_id: string | null
          units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_low_stock_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_products_complete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "vw_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_products_complete: {
        Row: {
          allow_backorder: boolean | null
          average_rating: number | null
          categories: Json | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          dimensions: Json | null
          id: string | null
          images: Json | null
          is_featured: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string | null
          price: number | null
          primary_image_url: string | null
          published_at: string | null
          review_count: number | null
          short_description: string | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          stock_quantity: number | null
          stock_status: string | null
          tags: Json | null
          tenant_id: string | null
          tenant_name: string | null
          tenant_slug: string | null
          track_inventory: boolean | null
          updated_at: string | null
          variants: Json | null
          weight: number | null
          weight_unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_recent_orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_first_name: string | null
          customer_last_name: string | null
          customer_name: string | null
          days_ago: number | null
          id: string | null
          item_count: number | null
          order_number: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["order_status"] | null
          tenant_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_name?: never
          days_ago?: never
          id?: string | null
          item_count?: never
          order_number?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tenant_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_first_name?: string | null
          customer_last_name?: string | null
          customer_name?: never
          days_ago?: never
          id?: string | null
          item_count?: never
          order_number?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tenant_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_top_products: {
        Row: {
          last_sold_at: string | null
          orders_count_30d: number | null
          orders_count_all_time: number | null
          price: number | null
          product_id: string | null
          product_name: string | null
          revenue_30d: number | null
          revenue_all_time: number | null
          sku: string | null
          stock_quantity: number | null
          tenant_id: string | null
          units_sold_30d: number | null
          units_sold_all_time: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_daily_sales: { Args: { p_date?: string }; Returns: undefined }
      create_default_email_templates: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      create_default_tenant_settings: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      get_or_create_customer: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_tenant_id: string
          p_user_id?: string
        }
        Returns: string
      }
      get_plan_limit: {
        Args: { p_plan: string; p_resource: string }
        Returns: number
      }
      get_sales_by_category: {
        Args: { p_tenant_id: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      get_tenant_by_domain: {
        Args: { p_domain: string }
        Returns: {
          accent_color: string
          business_name: string
          custom_domain: string
          id: string
          logo_url: string
          primary_color: string
          secondary_color: string
          settings: Json
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          subdomain: string
        }[]
      }
      is_superadmin: { Args: never; Returns: boolean }
      is_tenant_owner: { Args: { check_tenant_id: string }; Returns: boolean }
      search_products: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_query: string
          p_tenant_id: string
        }
        Returns: {
          description: string
          id: string
          name: string
          price: number
          primary_image_url: string
          rank: number
          slug: string
          stock_quantity: number
        }[]
      }
      user_tenant_ids: { Args: never; Returns: string[] }
      user_tenant_role: { Args: { check_tenant_id: string }; Returns: string }
      validate_discount_code: {
        Args: {
          p_cart_total: number
          p_code: string
          p_customer_id: string
          p_tenant_id: string
        }
        Returns: {
          discount_amount: number
          discount_id: string
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "payment"
        | "refund"
        | "status_change"
      discount_type: "percentage" | "fixed_amount" | "free_shipping"
      order_status:
        | "pending"
        | "processing"
        | "paid"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method:
        | "credit_card"
        | "debit_card"
        | "paypal"
        | "stripe"
        | "bank_transfer"
        | "cash_on_delivery"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      product_status: "draft" | "active" | "archived" | "out_of_stock"
      review_status: "pending" | "approved" | "rejected"
      subscription_plan: "free" | "basic" | "professional" | "enterprise"
      subscription_status:
        | "active"
        | "cancelled"
        | "suspended"
        | "expired"
        | "trial"
      tenant_status: "active" | "suspended" | "pending" | "cancelled"
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
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "payment",
        "refund",
        "status_change",
      ],
      discount_type: ["percentage", "fixed_amount", "free_shipping"],
      order_status: [
        "pending",
        "processing",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: [
        "credit_card",
        "debit_card",
        "paypal",
        "stripe",
        "bank_transfer",
        "cash_on_delivery",
      ],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      product_status: ["draft", "active", "archived", "out_of_stock"],
      review_status: ["pending", "approved", "rejected"],
      subscription_plan: ["free", "basic", "professional", "enterprise"],
      subscription_status: [
        "active",
        "cancelled",
        "suspended",
        "expired",
        "trial",
      ],
      tenant_status: ["active", "suspended", "pending", "cancelled"],
    },
  },
} as const
