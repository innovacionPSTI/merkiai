// Auto-generado con: pnpm db:generate
// Regenerar después de modificar el schema de Supabase
// Formato compatible con @supabase/supabase-js ^2.43.0

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          role: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
          tenant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
          tenant_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'
          tenant_id?: string
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          tenant_id: string
          id: number
          name: string
          slug: string
          description: string | null
          image_url: string | null
          parent_id: number | null
          meta_title: string | null
          meta_description: string | null
          order_index: number
          active: boolean
          created_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          parent_id?: number | null
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          parent_id?: number | null
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: number
          tenant_id: string
          name: string
          slug: string
          description: string | null
          category_id: number | null
          images: Json
          active: boolean
          featured: boolean
          allow_backorder: boolean
          seo_title: string | null
          seo_desc: string | null
          created_at: string
          variant_options: Json | null
          min_price: number | null
          max_price: number | null
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          slug: string
          description?: string | null
          category_id?: number | null
          images?: ProductImage[]
          active?: boolean
          featured?: boolean
          allow_backorder?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
          variant_options?: Json | null
          min_price?: number | null
          max_price?: number | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          category_id?: number | null
          images?: ProductImage[]
          active?: boolean
          featured?: boolean
          allow_backorder?: boolean
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
          variant_options?: Json | null
          min_price?: number | null
          max_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      product_variants: {
        Row: {
          tenant_id: string
          id: number
          product_id: number
          weight: string | null
          price: number
          compare_at_price: number | null
          image_url: string | null
          stock: number
          sku: string | null
          active: boolean
          weight_kg: number | null
          length_cm: number | null
          width_cm: number | null
          height_cm: number | null
          attributes: Json | null
          stock_item_id: number | null
        }
        Insert: {
          tenant_id?: string
          id?: number
          product_id: number
          weight?: string | null
          price: number
          compare_at_price?: number | null
          image_url?: string | null
          stock?: number
          sku?: string | null
          active?: boolean
          weight_kg?: number | null
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          attributes?: Json | null
          stock_item_id?: number | null
        }
        Update: {
          tenant_id?: string
          id?: number
          product_id?: number
          weight?: string | null
          price?: number
          compare_at_price?: number | null
          image_url?: string | null
          stock?: number
          sku?: string | null
          active?: boolean
          weight_kg?: number | null
          length_cm?: number | null
          width_cm?: number | null
          height_cm?: number | null
          attributes?: Json | null
          stock_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: number
          tenant_id: string
          order_number: string
          customer_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string | null
          shipping_addr: Json
          items: Json
          subtotal: number
          shipping_cost: number
          discount: number
          total: number
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method: 'wompi' | 'mercadopago' | 'tucompra' | 'bold' | 'manual' | null
          payment_id: string | null
          payment_status: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes: string | null
          skydropx_quotation_id: string | null
          skydropx_rate_id: string | null
          skydropx_shipment_id: string | null
          shipment_provider: string | null
          shipment_external_id: string | null
          tracking_number: string | null
          carrier_name: string | null
          label_url: string | null
          shipping_cost_final: number | null
          pickup_id: string | null
          pickup_date: string | null
          tucompra_codigo_seguimiento: string | null
          tucompra_numero_transaccion: string | null
          coupon_code: string | null
          gift_card_code: string | null
          gift_card_amount: number
          store_credit_amount: number
          stock_applied: boolean
          stock_restored: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          order_number: string
          customer_id?: string | null
          customer_name: string
          customer_email: string
          customer_phone?: string | null
          shipping_addr: ShippingAddress
          items: OrderItem[]
          subtotal: number
          shipping_cost: number
          discount?: number
          total: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | 'tucompra' | 'bold' | 'manual' | null
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes?: string | null
          skydropx_quotation_id?: string | null
          skydropx_rate_id?: string | null
          skydropx_shipment_id?: string | null
          shipment_provider?: string | null
          shipment_external_id?: string | null
          tracking_number?: string | null
          carrier_name?: string | null
          label_url?: string | null
          shipping_cost_final?: number | null
          pickup_id?: string | null
          pickup_date?: string | null
          tucompra_codigo_seguimiento?: string | null
          tucompra_numero_transaccion?: string | null
          coupon_code?: string | null
          gift_card_code?: string | null
          gift_card_amount?: number
          store_credit_amount?: number
          stock_applied?: boolean
          stock_restored?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          order_number?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string
          customer_phone?: string | null
          shipping_addr?: ShippingAddress
          items?: OrderItem[]
          subtotal?: number
          shipping_cost?: number
          discount?: number
          total?: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
          payment_method?: 'wompi' | 'mercadopago' | 'tucompra' | 'bold' | 'manual' | null
          payment_id?: string | null
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded'
          notes?: string | null
          skydropx_quotation_id?: string | null
          skydropx_rate_id?: string | null
          skydropx_shipment_id?: string | null
          shipment_provider?: string | null
          shipment_external_id?: string | null
          tracking_number?: string | null
          carrier_name?: string | null
          label_url?: string | null
          shipping_cost_final?: number | null
          pickup_id?: string | null
          pickup_date?: string | null
          tucompra_codigo_seguimiento?: string | null
          tucompra_numero_transaccion?: string | null
          coupon_code?: string | null
          gift_card_code?: string | null
          gift_card_amount?: number
          store_credit_amount?: number
          stock_applied?: boolean
          stock_restored?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      product_reviews: {
        Row: {
          id: number
          tenant_id: string
          product_id: number
          customer_id: string | null
          author_name: string
          rating: number
          title: string | null
          body: string | null
          status: 'pending' | 'approved' | 'rejected'
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          product_id: number
          customer_id?: string | null
          author_name: string
          rating: number
          title?: string | null
          body?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
          created_at?: string
        }
        Update: {
          author_name?: string
          rating?: number
          title?: string | null
          body?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          helpful_count?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          tenant_id: string
          actor_email: string | null
          actor_role: string | null
          action: string
          entity: string | null
          entity_id: string | null
          summary: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          actor_email?: string | null
          actor_role?: string | null
          action: string
          entity?: string | null
          entity_id?: string | null
          summary?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          summary?: string | null
          metadata?: Record<string, unknown>
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: number
          tenant_id: string
          type: string
          locale: string
          subject: string
          body: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          type: string
          locale?: string
          subject: string
          body: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          subject?: string
          body?: string
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          id: number
          tenant_id: string
          to_email: string
          type: string
          provider: string | null
          status: string
          entity: string | null
          error: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          to_email: string
          type: string
          provider?: string | null
          status: string
          entity?: string | null
          error?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          error?: string | null
        }
        Relationships: []
      }
      collections: {
        Row: {
          id: number
          tenant_id: string
          key: string
          label: string
          label_plural: string | null
          description: string | null
          icon: string | null
          fields: Json
          enabled: boolean
          order_index: number
          template_page_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          key: string
          label: string
          label_plural?: string | null
          description?: string | null
          icon?: string | null
          fields?: Json
          enabled?: boolean
          order_index?: number
          template_page_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          label?: string
          label_plural?: string | null
          description?: string | null
          icon?: string | null
          fields?: Json
          enabled?: boolean
          order_index?: number
          template_page_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          id: number
          tenant_id: string
          collection_key: string
          slug: string
          title: string | null
          status: string
          data: Json
          order_index: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          collection_key: string
          slug: string
          title?: string | null
          status?: string
          data?: Json
          order_index?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          collection_key?: string
          slug?: string
          title?: string | null
          status?: string
          data?: Json
          order_index?: number
          published_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_blocks: {
        Row: {
          id: number
          tenant_id: string
          label: string
          section_type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          label: string
          section_type: string
          payload?: Json
          created_at?: string
        }
        Update: {
          label?: string
          payload?: Json
        }
        Relationships: []
      }
      uoms: {
        Row: {
          id: number
          tenant_id: string
          code: string
          name: string
          dimension: string
          to_base_factor: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          code: string
          name: string
          dimension?: string
          to_base_factor?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          name?: string
          dimension?: string
          to_base_factor?: number
          updated_at?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          id: number
          tenant_id: string
          key: string
          name: string
          item_class: string
          uom_id: number | null
          sellable: boolean
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          key: string
          name: string
          item_class?: string
          uom_id?: number | null
          sellable?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          name?: string
          item_class?: string
          uom_id?: number | null
          sellable?: boolean
          active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: number
          tenant_id: string
          stock_item_id: number
          location_id: number | null
          movement_type: string
          direction: string
          qty: number
          uom_id: number | null
          qty_base: number
          reason: string | null
          ref_type: string | null
          ref_id: string | null
          op_key: string | null
          created_by: string | null
          unit_cost: number | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          stock_item_id: number
          location_id?: number | null
          movement_type: string
          direction: string
          qty: number
          uom_id?: number | null
          qty_base: number
          reason?: string | null
          ref_type?: string | null
          ref_id?: string | null
          op_key?: string | null
          created_by?: string | null
          unit_cost?: number | null
          created_at?: string
        }
        Update: {
          reason?: string | null
          ref_type?: string | null
          ref_id?: string | null
        }
        Relationships: []
      }
      stock_item_available: {
        Row: {
          tenant_id: string
          stock_item_id: number
          location_id: number | null
          available: number
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      suppliers: {
        Row: {
          id: number
          tenant_id: string
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          id: number
          tenant_id: string
          supplier_id: number | null
          location_id: number | null
          reference: string | null
          status: string
          notes: string | null
          received_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          supplier_id?: number | null
          location_id?: number | null
          reference?: string | null
          status?: string
          notes?: string | null
          received_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          supplier_id?: number | null
          location_id?: number | null
          reference?: string | null
          status?: string
          notes?: string | null
          received_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          id: number
          tenant_id: string
          purchase_id: number
          stock_item_id: number
          qty: number
          uom_id: number | null
          unit_cost: number
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          purchase_id: number
          stock_item_id: number
          qty: number
          uom_id?: number | null
          unit_cost?: number
          created_at?: string
        }
        Update: {
          qty?: number
          uom_id?: number | null
          unit_cost?: number
        }
        Relationships: []
      }
      redirects: {
        Row: {
          id: number
          tenant_id: string
          from_path: string
          to_path: string
          status_code: number
          active: boolean
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          from_path: string
          to_path: string
          status_code?: number
          active?: boolean
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          from_path?: string
          to_path?: string
          status_code?: number
          active?: boolean
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bundles: {
        Row: {
          id: number
          tenant_id: string
          name: string
          slug: string
          description: string | null
          price: number
          image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          slug: string
          description?: string | null
          price: number
          image_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          price?: number
          image_url?: string | null
          active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      bundle_components: {
        Row: {
          id: number
          tenant_id: string
          bundle_id: number
          variant_id: number
          qty: number
        }
        Insert: {
          id?: number
          tenant_id?: string
          bundle_id: number
          variant_id: number
          qty?: number
        }
        Update: {
          qty?: number
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          id: number
          tenant_id: string
          code: string
          initial_balance: number
          balance: number
          active: boolean
          note: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          code: string
          initial_balance: number
          balance: number
          active?: boolean
          note?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          active?: boolean
          note?: string | null
          expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_credit_ledger: {
        Row: {
          id: number
          tenant_id: string
          customer_id: string
          delta: number
          reason: string | null
          order_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          customer_id: string
          delta: number
          reason?: string | null
          order_id?: number | null
          created_at?: string
        }
        Update: {
          reason?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          id: number
          tenant_id: string
          name: string
          type: 'cart_percent' | 'cart_fixed' | 'category_percent' | 'bogo'
          config: Record<string, unknown>
          active: boolean
          priority: number
          combinable: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          type: 'cart_percent' | 'cart_fixed' | 'category_percent' | 'bogo'
          config?: Record<string, unknown>
          active?: boolean
          priority?: number
          combinable?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'cart_percent' | 'cart_fixed' | 'category_percent' | 'bogo'
          config?: Record<string, unknown>
          active?: boolean
          priority?: number
          combinable?: boolean
          starts_at?: string | null
          ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          id: number
          tenant_id: string
          name: string
          type: 'manual' | 'rules'
          rules: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          type?: 'manual' | 'rules'
          rules?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'manual' | 'rules'
          rules?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: []
      }
      customer_segment_members: {
        Row: {
          id: number
          tenant_id: string
          segment_id: number
          customer_id: string
          added_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          segment_id: number
          customer_id: string
          added_at?: string
        }
        Update: {
          segment_id?: number
          customer_id?: string
        }
        Relationships: []
      }
      vip_campaigns: {
        Row: {
          id: number
          tenant_id: string
          name: string
          segment_id: number | null
          starts_at: string
          ends_at: string
          status: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'
          offer_percent: number | null
          quota: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          name: string
          segment_id?: number | null
          starts_at: string
          ends_at: string
          status?: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'
          offer_percent?: number | null
          quota?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          segment_id?: number | null
          starts_at?: string
          ends_at?: string
          status?: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'
          offer_percent?: number | null
          quota?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      vip_campaign_scope: {
        Row: {
          id: number
          tenant_id: string
          campaign_id: number
          product_id: number | null
          category_id: number | null
        }
        Insert: {
          id?: number
          tenant_id?: string
          campaign_id: number
          product_id?: number | null
          category_id?: number | null
        }
        Update: {
          product_id?: number | null
          category_id?: number | null
        }
        Relationships: []
      }
      vip_campaign_notifications: {
        Row: {
          id: number
          tenant_id: string
          campaign_id: number
          customer_id: string
          channel: string
          sent_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          campaign_id: number
          customer_id: string
          channel?: string
          sent_at?: string
        }
        Update: {
          channel?: string
        }
        Relationships: []
      }
      order_returns: {
        Row: {
          id: number
          tenant_id: string
          order_id: number
          order_number: string
          reason: string | null
          status: 'requested' | 'approved' | 'rejected'
          restocked: boolean
          note: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: number
          tenant_id?: string
          order_id: number
          order_number: string
          reason?: string | null
          status?: 'requested' | 'approved' | 'rejected'
          restocked?: boolean
          note?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          reason?: string | null
          status?: 'requested' | 'approved' | 'rejected'
          restocked?: boolean
          note?: string | null
          resolved_at?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          id: number
          tenant_id: string
          customer_id: string
          product_id: number
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          customer_id: string
          product_id: number
          created_at?: string
        }
        Update: {
          product_id?: number
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          id: number
          tenant_id: string
          variant_id: number
          email: string
          created_at: string
          notified_at: string | null
        }
        Insert: {
          id?: number
          tenant_id?: string
          variant_id: number
          email: string
          created_at?: string
          notified_at?: string | null
        }
        Update: {
          notified_at?: string | null
        }
        Relationships: []
      }
      integration_instances: {
        Row: {
          id: string
          tenant_id: string
          kind: 'payment' | 'shipping' | 'email'
          provider: string
          label: string | null
          environment: 'test' | 'production'
          credentials: Record<string, unknown>
          settings: Record<string, unknown>
          enabled: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          kind: 'payment' | 'shipping' | 'email'
          provider: string
          label?: string | null
          environment?: 'test' | 'production'
          credentials?: Record<string, unknown>
          settings?: Record<string, unknown>
          enabled?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          provider?: string
          label?: string | null
          environment?: 'test' | 'production'
          credentials?: Record<string, unknown>
          settings?: Record<string, unknown>
          enabled?: boolean
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          tenant_id: string
          id: number
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          cover_image: string | null
          category: string | null
          author_id: string | null
          published: boolean
          published_at: string | null
          seo_title: string | null
          seo_desc: string | null
          created_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          author_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          category?: string | null
          author_id?: string | null
          published?: boolean
          published_at?: string | null
          seo_title?: string | null
          seo_desc?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: number
          email: string
          subscribed_at: string
          active: boolean
          tenant_id: string
        }
        Insert: {
          id?: number
          email: string
          subscribed_at?: string
          active?: boolean
          tenant_id?: string
        }
        Update: {
          id?: number
          email?: string
          subscribed_at?: string
          active?: boolean
          tenant_id?: string
        }
        Relationships: []
      }
      shipping_config: {
        Row: {
          id: number
          tenant_id: string
          provider: 'fixed' | 'skydropx'
          fixed_rate: number
          handling_fee_fixed: number
          handling_fee_percent: number
          free_shipping_enabled: boolean
          free_shipping_min_amount: number
          skydropx_client_id: string | null
          skydropx_client_secret: string | null
          skydropx_address_from_id: string | null
          skydropx_base_url: string
          origin_name: string | null
          origin_street: string | null
          origin_neighborhood: string | null
          origin_city: string | null
          origin_department: string | null
          origin_postal_code: string | null
          origin_phone: string | null
          origin_email: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          handling_fee_fixed?: number
          handling_fee_percent?: number
          free_shipping_enabled?: boolean
          free_shipping_min_amount?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          origin_name?: string | null
          origin_street?: string | null
          origin_neighborhood?: string | null
          origin_city?: string | null
          origin_department?: string | null
          origin_postal_code?: string | null
          origin_phone?: string | null
          origin_email?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          provider?: 'fixed' | 'skydropx'
          fixed_rate?: number
          handling_fee_fixed?: number
          handling_fee_percent?: number
          free_shipping_enabled?: boolean
          free_shipping_min_amount?: number
          skydropx_client_id?: string | null
          skydropx_client_secret?: string | null
          skydropx_address_from_id?: string | null
          skydropx_base_url?: string
          origin_name?: string | null
          origin_street?: string | null
          origin_neighborhood?: string | null
          origin_city?: string | null
          origin_department?: string | null
          origin_postal_code?: string | null
          origin_phone?: string | null
          origin_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_config: {
        Row: {
          id: number
          tenant_id: string
          template: string
          whatsapp_number: string | null
          store_name: string
          store_email: string | null
          logo_url: string | null
          resend_api_key: string | null
          resend_from_email: string | null
          terms_content: string | null
          privacy_content: string | null
          instagram_url: string | null
          instagram_enabled: boolean
          facebook_url: string | null
          facebook_enabled: boolean
          tiktok_url: string | null
          tiktok_enabled: boolean
          maintenance_mode: boolean
          analytics_enabled: boolean
          trust_badges: Json
          footer_show_store: boolean
          footer_show_blog: boolean
          footer_show_legal: boolean
          nav_show_cart: boolean
          nav_show_auth: boolean
          nav_show_wishlist: boolean
          email_provider: string
          order_prefix: string
          pdp_shipping_estimator: boolean
          pdp_recommendations: boolean
          pdp_share_enabled: boolean
          low_stock_threshold: number
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          terms_content?: string | null
          privacy_content?: string | null
          instagram_url?: string | null
          instagram_enabled?: boolean
          facebook_url?: string | null
          facebook_enabled?: boolean
          tiktok_url?: string | null
          tiktok_enabled?: boolean
          maintenance_mode?: boolean
          analytics_enabled?: boolean
          trust_badges?: Json
          footer_show_store?: boolean
          footer_show_blog?: boolean
          footer_show_legal?: boolean
          nav_show_cart?: boolean
          nav_show_auth?: boolean
          nav_show_wishlist?: boolean
          email_provider?: string
          order_prefix?: string
          pdp_shipping_estimator?: boolean
          pdp_recommendations?: boolean
          pdp_share_enabled?: boolean
          low_stock_threshold?: number
          updated_at?: string
        }
        Update: {
          id?: number
          whatsapp_number?: string | null
          store_name?: string
          store_email?: string | null
          logo_url?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          terms_content?: string | null
          privacy_content?: string | null
          instagram_url?: string | null
          instagram_enabled?: boolean
          facebook_url?: string | null
          facebook_enabled?: boolean
          tiktok_url?: string | null
          tiktok_enabled?: boolean
          maintenance_mode?: boolean
          analytics_enabled?: boolean
          trust_badges?: Json
          footer_show_store?: boolean
          footer_show_blog?: boolean
          footer_show_legal?: boolean
          nav_show_cart?: boolean
          nav_show_auth?: boolean
          nav_show_wishlist?: boolean
          email_provider?: string
          order_prefix?: string
          pdp_shipping_estimator?: boolean
          pdp_recommendations?: boolean
          pdp_share_enabled?: boolean
          low_stock_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          tenant_id: string
          id: number
          nav_key: string
          label: string
          href: string | null
          page_key: string | null
          enabled: boolean
          order_index: number
          parent_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          nav_key?: string
          label: string
          href?: string | null
          page_key?: string | null
          enabled?: boolean
          order_index?: number
          parent_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          nav_key?: string
          label?: string
          href?: string | null
          page_key?: string | null
          enabled?: boolean
          order_index?: number
          parent_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nav_items_page_key_fkey'
            columns: ['page_key']
            referencedRelation: 'pages'
            referencedColumns: ['key']
          }
        ]
      }
      coupons: {
        Row: {
          tenant_id: string
          id: number
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount: number
          max_uses: number | null
          used_count: number
          expires_at: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          code: string
          type: 'percentage' | 'fixed'
          value: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          code?: string
          type?: 'percentage' | 'fixed'
          value?: number
          min_order_amount?: number
          max_uses?: number | null
          used_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          tenant_id: string
          key: string
          label: string
          slug: string
          page_type: string
          enabled: boolean
          show_in_footer: boolean
          meta_title: string | null
          meta_description: string | null
          order_index: number
          style: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          key: string
          label: string
          slug: string
          page_type?: string
          enabled?: boolean
          show_in_footer?: boolean
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          style?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          key?: string
          label?: string
          slug?: string
          page_type?: string
          enabled?: boolean
          show_in_footer?: boolean
          meta_title?: string | null
          meta_description?: string | null
          order_index?: number
          style?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          tenant_id: string
          id: number
          section_key: string    // UUID estable para export/import
          page_key: string
          section_type: string
          title: string | null
          subtitle: string | null
          body: string | null
          image_url: string | null
          cta_label: string | null
          cta_url: string | null
          enabled: boolean
          order_index: number
          settings: Json
          draft: Json | null
          row_id: string | null
          row_layout: string | null
          col_index: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          section_key?: string
          page_key: string
          section_type?: string
          title?: string | null
          subtitle?: string | null
          body?: string | null
          image_url?: string | null
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          order_index?: number
          settings?: Json
          draft?: Json | null
          row_id?: string | null
          row_layout?: string | null
          col_index?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          section_key?: string
          page_key?: string
          section_type?: string
          title?: string | null
          subtitle?: string | null
          body?: string | null
          image_url?: string | null
          cta_label?: string | null
          cta_url?: string | null
          enabled?: boolean
          order_index?: number
          settings?: Json
          draft?: Json | null
          row_id?: string | null
          row_layout?: string | null
          col_index?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'page_sections_page_key_fkey'
            columns: ['page_key']
            referencedRelation: 'pages'
            referencedColumns: ['key']
          }
        ]
      }
      section_items: {
        Row: {
          tenant_id: string
          id: number
          section_id: number
          item_type: string
          icon: string | null
          title: string | null
          description: string | null
          question: string | null
          answer: string | null
          image_url: string | null
          image_url_mobile: string | null
          link_url: string | null
          cta_text: string | null
          metadata: Json
          enabled: boolean
          order_index: number
          draft: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          section_id: number
          item_type?: string
          icon?: string | null
          title?: string | null
          description?: string | null
          question?: string | null
          answer?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          link_url?: string | null
          cta_text?: string | null
          metadata?: Json
          enabled?: boolean
          order_index?: number
          draft?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          section_id?: number
          item_type?: string
          icon?: string | null
          title?: string | null
          description?: string | null
          question?: string | null
          answer?: string | null
          image_url?: string | null
          image_url_mobile?: string | null
          link_url?: string | null
          cta_text?: string | null
          metadata?: Json
          enabled?: boolean
          order_index?: number
          draft?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'section_items_section_id_fkey'
            columns: ['section_id']
            referencedRelation: 'page_sections'
            referencedColumns: ['id']
          }
        ]
      }
      cart_items: {
        Row: {
          id: number
          tenant_id: string
          customer_id: string
          variant_id: number
          product_id: number
          product_name: string
          variant_label: string
          qty: number
          price: number
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          customer_id: string
          variant_id: number
          product_id: number
          product_name: string
          variant_label: string
          qty?: number
          price: number
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tenant_id?: string
          customer_id?: string
          variant_id?: number
          product_id?: number
          product_name?: string
          variant_label?: string
          qty?: number
          price?: number
          image_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      payment_config: {
        Row: {
          id: number
          tenant_id: string
          active_provider: 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'
          wompi_public_key: string | null
          wompi_private_key: string | null
          wompi_integrity_secret: string | null
          wompi_events_secret: string | null
          mercadopago_access_token: string | null
          mercadopago_public_key: string | null
          mercadopago_webhook_secret: string | null
          tucompra_merchant_id: string | null
          tucompra_secret_key: string | null
          tucompra_sandbox: boolean
          tucompra_user: string | null
          tucompra_password: string | null
          tucompra_terminal: string | null
          tucompra_api_url: string | null
          tucompra_public_key: string | null
          tucompra_encryption_key: string | null
          tucompra_methods: Json | null
          bold_api_key: string | null
          bold_secret_key: string | null
          bold_sandbox: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          active_provider?: 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'
          wompi_public_key?: string | null
          wompi_private_key?: string | null
          wompi_integrity_secret?: string | null
          wompi_events_secret?: string | null
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_webhook_secret?: string | null
          tucompra_merchant_id?: string | null
          tucompra_secret_key?: string | null
          tucompra_sandbox?: boolean
          tucompra_user?: string | null
          tucompra_password?: string | null
          tucompra_terminal?: string | null
          tucompra_api_url?: string | null
          tucompra_public_key?: string | null
          tucompra_encryption_key?: string | null
          tucompra_methods?: Json | null
          bold_api_key?: string | null
          bold_secret_key?: string | null
          bold_sandbox?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          active_provider?: 'none' | 'wompi' | 'mercadopago' | 'tucompra' | 'bold'
          wompi_public_key?: string | null
          wompi_private_key?: string | null
          wompi_integrity_secret?: string | null
          wompi_events_secret?: string | null
          mercadopago_access_token?: string | null
          mercadopago_public_key?: string | null
          mercadopago_webhook_secret?: string | null
          tucompra_merchant_id?: string | null
          tucompra_secret_key?: string | null
          tucompra_sandbox?: boolean
          tucompra_user?: string | null
          tucompra_password?: string | null
          tucompra_terminal?: string | null
          tucompra_api_url?: string | null
          tucompra_public_key?: string | null
          tucompra_encryption_key?: string | null
          tucompra_methods?: Json | null
          bold_api_key?: string | null
          bold_secret_key?: string | null
          bold_sandbox?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      processed_webhook_events: {
        Row: {
          provider: string
          event_id: string
          created_at: string
        }
        Insert: {
          provider: string
          event_id: string
          created_at?: string
        }
        Update: {
          provider?: string
          event_id?: string
          created_at?: string
        }
        Relationships: []
      }
      shipping_profiles: {
        Row: {
          tenant_id: string
          id: number
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          address: string | null
          city: string | null
          department: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          department?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          department?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          stack_id: string | null
          email: string
          name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          stack_id?: string | null
          email: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          stack_id?: string | null
          email?: string
          name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          id: string
          tenant_id: string
          customer_id: string
          label: string | null
          full_name: string
          phone: string | null
          address: string
          city: string
          department: string | null
          postal_code: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string
          customer_id: string
          label?: string | null
          full_name: string
          phone?: string | null
          address: string
          city: string
          department?: string | null
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          customer_id?: string
          label?: string | null
          full_name?: string
          phone?: string | null
          address?: string
          city?: string
          department?: string | null
          postal_code?: string | null
          is_default?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_addresses_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          tenant_id: string
          id: number
          order_id: string | null
          product_id: number
          variant_id: number
          product_name: string
          variant_label: string
          image_url: string | null
          qty: number
          price: number
        }
        Insert: {
          tenant_id?: string
          id?: number
          order_id?: string | null
          product_id: number
          variant_id: number
          product_name: string
          variant_label: string
          image_url?: string | null
          qty?: number
          price: number
        }
        Update: {
          tenant_id?: string
          id?: number
          order_id?: string | null
          product_id?: number
          variant_id?: number
          product_name?: string
          variant_label?: string
          image_url?: string | null
          qty?: number
          price?: number
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          tenant_id: string
          key: string
          url: string
          bucket: string
          mime_type: string | null
          size_bytes: number | null
          width_px: number | null
          height_px: number | null
          alt_text: string | null
          used_in: Json
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          key: string
          url: string
          bucket?: string
          mime_type?: string | null
          size_bytes?: number | null
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          used_in?: Json
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          key?: string
          url?: string
          bucket?: string
          mime_type?: string | null
          size_bytes?: number | null
          width_px?: number | null
          height_px?: number | null
          alt_text?: string | null
          used_in?: Json
          uploaded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'media_assets_uploaded_by_fkey'
            columns: ['uploaded_by']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      variant_types: {
        Row: {
          tenant_id: string
          id: number
          name: string
          values: Json          // string[]
          swatch_hex: Json      // { [value]: hex }
          display_type: 'pill' | 'swatch'
          active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          name: string
          values?: Json
          swatch_hex?: Json
          display_type?: 'pill' | 'swatch'
          active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          name?: string
          values?: Json
          swatch_hex?: Json
          display_type?: 'pill' | 'swatch'
          active?: boolean
          order_index?: number
          created_at?: string
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          id: number
          tenant_id: string
          accent_color: string
          sidebar_color: string
          updated_at: string
        }
        Insert: {
          id?: number
          tenant_id?: string
          accent_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Update: {
          id?: number
          accent_color?: string
          sidebar_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          tenant_id: string
          id: number
          name: string
          is_active: boolean
          is_default: boolean
          color_primary: string
          color_dark: string
          color_cream: string
          color_cream_warm: string
          color_yellow: string
          color_yellow_pale: string
          color_text: string
          color_price: string | null
          font_display: string
          font_body: string
          color_scheme: string
          dark_bg: string | null
          dark_surface: string | null
          dark_text: string | null
          template: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id?: string
          id?: number
          name: string
          is_active?: boolean
          is_default?: boolean
          color_primary?: string
          color_dark?: string
          color_cream?: string
          color_cream_warm?: string
          color_yellow?: string
          color_yellow_pale?: string
          color_text?: string
          color_price?: string | null
          font_display?: string
          font_body?: string
          color_scheme?: string
          dark_bg?: string | null
          dark_surface?: string | null
          dark_text?: string | null
          template?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          id?: number
          name?: string
          is_active?: boolean
          is_default?: boolean
          color_primary?: string
          color_dark?: string
          color_cream?: string
          color_cream_warm?: string
          color_yellow?: string
          color_yellow_pale?: string
          color_text?: string
          color_price?: string | null
          font_display?: string
          font_body?: string
          color_scheme?: string
          dark_bg?: string | null
          dark_surface?: string | null
          dark_text?: string | null
          template?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_coupon_usage: {
        Args: { coupon_code: string }
        Returns: undefined
      }
      decrement_variant_stock: {
        Args: { p_variant_id: number; p_qty: number }
        Returns: boolean
      }
      restore_variant_stock: {
        Args: { p_variant_id: number; p_qty: number }
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<string, never>
        Returns: string
      }
      increment_review_helpful: {
        Args: { p_id: number }
        Returns: number
      }
    }
    Enums: {
      order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'exception'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Domain Types ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'exception'

export type ShippingProviderType = 'fixed' | 'skydropx'

export type UserRole = 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda' | 'miembro' | 'customer'

export interface ProductImage {
  url: string
  alt: string
  order: number
}

export interface ShippingAddress {
  address: string
  city: string
  department: string
  postal_code?: string
  reference?: string
}

export interface OrderItem {
  variant_id: number
  product_name: string
  variant_label: string
  qty: number
  price: number
}

// ─── Convenience aliases ───────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Omit<Database['public']['Tables']['products']['Row'], 'images'> & {
  images: ProductImage[]
}
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type Order = Omit<Database['public']['Tables']['orders']['Row'], 'shipping_addr' | 'items'> & {
  shipping_addr: ShippingAddress
  items: OrderItem[]
}
export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type ProductReview = Database['public']['Tables']['product_reviews']['Row']
export type StockNotification = Database['public']['Tables']['stock_notifications']['Row']
export type OrderReturn = Database['public']['Tables']['order_returns']['Row']
export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type StoreConfigRow = Database['public']['Tables']['store_config']['Row']
export type PaymentConfig = Database['public']['Tables']['payment_config']['Row']

export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerAddress = Database['public']['Tables']['customer_addresses']['Row']

export type ProductWithVariants = Product & {
  variants: ProductVariant[]
  category: Category | null
}

export type OrderWithItems = Order & {
  customer?: Customer | null
}

export type CustomerWithAddresses = Customer & {
  addresses: CustomerAddress[]
}

export type Coupon = Database['public']['Tables']['coupons']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Page = Database['public']['Tables']['pages']['Row']
export type PageSection = Database['public']['Tables']['page_sections']['Row']
export type SectionItem = Database['public']['Tables']['section_items']['Row']
export type NavItem = Database['public']['Tables']['nav_items']['Row']
export type MediaAsset = Database['public']['Tables']['media_assets']['Row']

/** Tipos válidos de página (page_type) */
export type PageType = 'landing' | 'services' | 'about' | 'faq' | 'home' | 'custom'

/** Tipos válidos de sección (section_type) */
export type SectionType =
  | 'hero'
  | 'text'
  | 'cards'
  | 'faq'
  | 'cta'
  | 'testimonials'
  | 'whatsapp'
  | 'services'
  | 'featured_products'
  | 'best_sellers'
  | 'historia'
  | 'blog_preview'
  | 'newsletter'

/** Página con sus secciones y los ítems de cada sección */
export type PageWithSections = Page & {
  sections: (PageSection & { items: SectionItem[] })[]
}

export type VariantType = Omit<Database['public']['Tables']['variant_types']['Row'], 'values' | 'swatch_hex'> & {
  values: string[]
  /** HU-264 · mapa valor→hex para swatches (puede faltar en filas antiguas). */
  swatch_hex: Record<string, string>
}
