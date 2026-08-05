module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/packages/database/src/client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBrowserClient",
    ()=>createBrowserClient,
    "createServerClient",
    ()=>createServerClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$2$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.110.2/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://bitmwhobaoynzmjknupg.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "sb_publishable_x-Ec3NOh81uQGe51IJ9KaA_VCJWWJ9o");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
function createBrowserClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$2$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
}
function createServerClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$2$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false
        }
    });
}
}),
"[project]/packages/database/src/queries/products.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBestSellingProducts",
    ()=>getBestSellingProducts,
    "getCategories",
    ()=>getCategories,
    "getFeaturedProducts",
    ()=>getFeaturedProducts,
    "getProductBySlug",
    ()=>getProductBySlug,
    "getProducts",
    ()=>getProducts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getProducts(filters) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('products').select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `).eq('active', true).order('created_at', {
        ascending: false
    });
    if (filters?.featured) query = query.eq('featured', true);
    if (filters?.category_slug) {
        query = query.eq('categories.slug', filters.category_slug);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
}
async function getProductBySlug(slug) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('products').select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `).eq('slug', slug).eq('active', true).single();
    if (error) throw error;
    return data;
}
async function getFeaturedProducts(limit = 3) {
    return getProducts({
        featured: true
    }).then((products)=>products.slice(0, limit));
}
async function getBestSellingProducts(limit = 4) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // Aggregate order_items by product_id
    const { data: items } = await supabase.from('order_items').select('product_id, product_name, image_url, qty');
    if (items?.length) {
        const map = new Map();
        for (const item of items){
            const pid = item.product_id;
            const existing = map.get(pid);
            if (existing) {
                existing.total_sold += item.qty;
            } else {
                map.set(pid, {
                    product_id: pid,
                    product_name: item.product_name,
                    image_url: item.image_url,
                    slug: null,
                    total_sold: item.qty
                });
            }
        }
        // Enrich with slug from products table
        const productIds = [
            ...map.keys()
        ];
        const { data: products } = await supabase.from('products').select('id, slug').in('id', productIds).eq('active', true);
        for (const p of products ?? []){
            const entry = map.get(p.id);
            if (entry) entry.slug = p.slug;
        }
        const sorted = [
            ...map.values()
        ].sort((a, b)=>b.total_sold - a.total_sold).slice(0, limit);
        if (sorted.length > 0) return sorted;
    }
    // Fallback: productos más recientes
    const { data: fallback } = await supabase.from('products').select('id, name, slug, images').eq('active', true).order('created_at', {
        ascending: false
    }).limit(limit);
    return (fallback ?? []).map((p)=>{
        const imgs = Array.isArray(p.images) ? p.images : [];
        return {
            product_id: p.id,
            product_name: p.name,
            image_url: imgs[0]?.url ?? null,
            slug: p.slug,
            total_sold: 0
        };
    });
}
async function getCategories() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('order_index', {
        ascending: true
    });
    if (error) throw error;
    return data ?? [];
}
}),
"[project]/packages/database/src/queries/orders.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createOrder",
    ()=>createOrder,
    "getOrderById",
    ()=>getOrderById,
    "getOrdersByCustomer",
    ()=>getOrdersByCustomer,
    "getOrdersByCustomerEmail",
    ()=>getOrdersByCustomerEmail,
    "updateOrderStatus",
    ()=>updateOrderStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function createOrder(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // Generar número de orden: VPS-XXXX
    const { count } = await supabase.from('orders').select('*', {
        count: 'exact',
        head: true
    });
    const orderNumber = `VPS-${String((count ?? 0) + 1).padStart(4, '0')}`;
    const { data, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        ...input,
        discount: input.discount ?? 0,
        status: 'pending',
        payment_status: 'pending'
    }).select().single();
    if (error) throw error;
    return data;
}
async function getOrdersByCustomer(customerId) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', {
        ascending: false
    });
    if (error) throw error;
    return data ?? [];
}
async function getOrdersByCustomerEmail(email) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('orders').select('*').eq('customer_email', email.toLowerCase()).order('created_at', {
        ascending: false
    });
    if (error) throw error;
    return data ?? [];
}
async function getOrderById(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
}
async function updateOrderStatus(id, status, extra) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('orders').update({
        status,
        updated_at: new Date().toISOString(),
        ...extra
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/blog.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getBlogPostBySlug",
    ()=>getBlogPostBySlug,
    "getBlogPostBySlugAny",
    ()=>getBlogPostBySlugAny,
    "getBlogPosts",
    ()=>getBlogPosts,
    "getFeaturedPost",
    ()=>getFeaturedPost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getBlogPosts(options) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('blog_posts').select('*').eq('published', true).order('published_at', {
        ascending: false
    });
    if (options?.category) query = query.eq('category', options.category);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
}
async function getBlogPostBySlug(slug) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single();
    if (error) throw error;
    return data;
}
async function getBlogPostBySlugAny(slug) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();
    if (error) throw error;
    return data;
}
async function getFeaturedPost() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('blog_posts').select('*').eq('published', true).order('published_at', {
        ascending: false
    }).limit(1).single();
    if (error) return null;
    return data;
}
}),
"[project]/packages/database/src/queries/shipping-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getShippingConfig",
    ()=>getShippingConfig,
    "updateShippingConfig",
    ()=>updateShippingConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getShippingConfig() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('shipping_config').select('*').limit(1).single();
    if (error || !data) {
        // Safe fallback — fixed rate, no external provider
        return {
            id: 0,
            provider: 'fixed',
            fixed_rate: 8000,
            free_shipping_enabled: true,
            free_shipping_min_amount: 100000,
            skydropx_client_id: null,
            skydropx_client_secret: null,
            skydropx_address_from_id: null,
            skydropx_base_url: 'https://app.skydropx.com',
            origin_name: null,
            origin_street: null,
            origin_neighborhood: null,
            origin_city: null,
            origin_department: null,
            origin_postal_code: null,
            origin_phone: null,
            origin_email: null,
            updated_at: new Date().toISOString()
        };
    }
    return data;
}
async function updateShippingConfig(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('shipping_config').update({
        ...input,
        updated_at: new Date().toISOString()
    }).eq('id', 1).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/store-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getStoreConfig",
    ()=>getStoreConfig,
    "updateStoreConfig",
    ()=>updateStoreConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
const DEFAULT_CONFIG = {
    id: 1,
    whatsapp_number: null,
    store_name: 'Mi Tienda',
    store_description: null,
    seo_keywords: null,
    store_email: null,
    logo_url: null,
    favicon_url: null,
    resend_api_key: null,
    resend_from_email: null,
    terms_content: null,
    privacy_content: null,
    instagram_url: null,
    instagram_enabled: true,
    facebook_url: null,
    facebook_enabled: true,
    tiktok_url: null,
    tiktok_enabled: true,
    maintenance_mode: false,
    analytics_enabled: false,
    trust_badges: [],
    footer_show_store: true,
    footer_show_blog: true,
    footer_show_legal: true,
    nav_show_cart: true,
    nav_show_auth: true,
    email_provider: 'resend',
    updated_at: new Date().toISOString()
};
async function getStoreConfig() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('store_config').select('*').limit(1).single();
    if (error || !data) return DEFAULT_CONFIG;
    // Cast through unknown because Supabase types trust_badges as Json (no index sig)
    // but at runtime it is always TrustBadge[] thanks to the migration default.
    return {
        ...data,
        trust_badges: Array.isArray(data.trust_badges) ? data.trust_badges : []
    };
}
async function updateStoreConfig(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // No sobreescribir resend_api_key si viene vacío
    const sanitized = {
        ...input
    };
    if (sanitized['resend_api_key'] === '') delete sanitized['resend_api_key'];
    const { data, error } = await supabase.from('store_config')// eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({
        id: 1,
        ...sanitized,
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return {
        ...data,
        trust_badges: Array.isArray(data.trust_badges) ? data.trust_badges : []
    };
}
}),
"[project]/packages/database/src/queries/payment-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPaymentConfig",
    ()=>getPaymentConfig,
    "updatePaymentConfig",
    ()=>updatePaymentConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getPaymentConfig() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('payment_config').select('*').eq('id', 1).single();
    if (error) {
        if (error.code === 'PGRST116') return null // sin filas
        ;
        throw error;
    }
    return data;
}
async function updatePaymentConfig(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // Filtrar strings vacíos en campos de credenciales secretas
    const secretFields = [
        'wompi_public_key',
        'wompi_private_key',
        'wompi_integrity_secret',
        'wompi_events_secret',
        'mercadopago_access_token',
        'mercadopago_public_key',
        'tucompra_merchant_id',
        'tucompra_secret_key'
    ];
    const sanitized = {
        ...input
    };
    for (const field of secretFields){
        if (field in sanitized && sanitized[field] === '') {
            delete sanitized[field];
        }
    }
    const { data, error } = await supabase.from('payment_config').update({
        ...sanitized,
        updated_at: new Date().toISOString()
    }).eq('id', 1).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/shipping-profile.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getShippingProfile",
    ()=>getShippingProfile,
    "upsertShippingProfile",
    ()=>upsertShippingProfile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getShippingProfile(email) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('shipping_profiles').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
}
async function upsertShippingProfile(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('shipping_profiles').upsert({
        ...input,
        updated_at: new Date().toISOString()
    }, {
        onConflict: 'email'
    }).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/coupons.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createCoupon",
    ()=>createCoupon,
    "deleteCoupon",
    ()=>deleteCoupon,
    "getCouponByCode",
    ()=>getCouponByCode,
    "getCoupons",
    ()=>getCoupons,
    "incrementCouponUsage",
    ()=>incrementCouponUsage,
    "updateCoupon",
    ()=>updateCoupon,
    "validateCoupon",
    ()=>validateCoupon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getCoupons() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', {
        ascending: false
    });
    if (error) throw error;
    return data;
}
async function getCouponByCode(code) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('coupons').select('*').ilike('code', code).maybeSingle();
    if (error) throw error;
    return data;
}
function validateCoupon(coupon, orderSubtotal) {
    if (!coupon.active) return {
        valid: false,
        error: 'Cupón inactivo'
    };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return {
            valid: false,
            error: 'El cupón ha expirado'
        };
    }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return {
            valid: false,
            error: 'El cupón ha alcanzado el límite de usos'
        };
    }
    if (orderSubtotal < coupon.min_order_amount) {
        return {
            valid: false,
            error: `Monto mínimo de pedido: $${coupon.min_order_amount.toLocaleString('es-CO')}`
        };
    }
    const discount = coupon.type === 'percentage' ? Math.round(orderSubtotal * coupon.value / 100) : Math.min(coupon.value, orderSubtotal);
    return {
        valid: true,
        coupon,
        discount
    };
}
async function createCoupon(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('coupons').insert({
        ...input,
        code: input.code.toUpperCase()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updateCoupon(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update = {
        ...input
    };
    if (input.code) update.code = input.code.toUpperCase();
    const { data, error } = await supabase.from('coupons').update(update).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
async function deleteCoupon(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
}
async function incrementCouponUsage(code) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    await supabase.rpc('increment_coupon_usage', {
        coupon_code: code
    }).throwOnError();
}
}),
"[project]/packages/database/src/queries/cart.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearCart",
    ()=>clearCart,
    "getCartItems",
    ()=>getCartItems,
    "removeCartItem",
    ()=>removeCartItem,
    "replaceCart",
    ()=>replaceCart,
    "upsertCartItem",
    ()=>upsertCartItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getCartItems(customerId) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('cart_items').select('*').eq('customer_id', customerId).order('created_at', {
        ascending: true
    });
    if (error) throw error;
    return data;
}
async function upsertCartItem(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('cart_items').upsert(input, {
        onConflict: 'customer_id,variant_id'
    }).select().single();
    if (error) throw error;
    return data;
}
async function removeCartItem(customerId, variantId) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('cart_items').delete().eq('customer_id', customerId).eq('variant_id', variantId);
    if (error) throw error;
}
async function clearCart(customerId) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('cart_items').delete().eq('customer_id', customerId);
    if (error) throw error;
}
async function replaceCart(customerId, items) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // 1. Borrar todo el carrito actual
    await supabase.from('cart_items').delete().eq('customer_id', customerId);
    // 2. Insertar los ítems nuevos (si los hay)
    if (items.length === 0) return;
    const { error } = await supabase.from('cart_items').insert(items);
    if (error) throw error;
}
}),
"[project]/packages/database/src/queries/themes.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTheme",
    ()=>createTheme,
    "deleteTheme",
    ()=>deleteTheme,
    "getActiveTheme",
    ()=>getActiveTheme,
    "getThemes",
    ()=>getThemes,
    "setActiveTheme",
    ()=>setActiveTheme,
    "updateTheme",
    ()=>updateTheme
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getThemes() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('themes').select('*').order('created_at', {
        ascending: true
    });
    if (error) throw error;
    return data ?? [];
}
async function getActiveTheme() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data } = await supabase.from('themes').select('*').eq('is_active', true).maybeSingle();
    return data ?? null;
}
async function createTheme(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('themes').insert({
        ...input,
        is_active: false
    }).select().single();
    if (error) throw error;
    return data;
}
async function updateTheme(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('themes').update(input).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
async function setActiveTheme(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // 1. Desactivar cualquier tema activo actual
    await supabase.from('themes').update({
        is_active: false
    }).eq('is_active', true);
    // 2. Activar el tema elegido
    const { error } = await supabase.from('themes').update({
        is_active: true
    }).eq('id', id);
    if (error) throw error;
}
async function deleteTheme(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data: theme } = await supabase.from('themes').select('is_active, is_default').eq('id', id).maybeSingle();
    if (!theme) throw new Error('Tema no encontrado');
    if (theme.is_active) throw new Error('No se puede eliminar el tema activo');
    if (theme.is_default) throw new Error('No se puede eliminar el tema por defecto');
    const { error } = await supabase.from('themes').delete().eq('id', id);
    if (error) throw error;
}
}),
"[project]/packages/database/src/queries/variant-types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createVariantType",
    ()=>createVariantType,
    "deleteVariantType",
    ()=>deleteVariantType,
    "getVariantTypeById",
    ()=>getVariantTypeById,
    "getVariantTypes",
    ()=>getVariantTypes,
    "updateVariantType",
    ()=>updateVariantType
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
function toVariantType(row) {
    return {
        ...row,
        values: Array.isArray(row.values) ? row.values : []
    };
}
async function getVariantTypes(activeOnly = false) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('variant_types').select('*').order('order_index', {
        ascending: true
    }).order('id', {
        ascending: true
    });
    if (activeOnly) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toVariantType);
}
async function getVariantTypeById(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('variant_types').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toVariantType(data) : null;
}
async function createVariantType(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('variant_types').insert({
        name: input.name.trim(),
        values: input.values,
        display_type: input.display_type ?? 'pill',
        order_index: input.order_index ?? 0
    }).select().single();
    if (error) throw new Error(error.message);
    return toVariantType(data);
}
async function updateVariantType(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const patch = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.values !== undefined) patch.values = input.values;
    if (input.display_type !== undefined) patch.display_type = input.display_type;
    if (input.active !== undefined) patch.active = input.active;
    if (input.order_index !== undefined) patch.order_index = input.order_index;
    const { data, error } = await supabase.from('variant_types').update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toVariantType(data);
}
async function deleteVariantType(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('variant_types').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
}),
"[project]/packages/database/src/queries/content.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createPage",
    ()=>createPage,
    "createPageSection",
    ()=>createPageSection,
    "createSectionItem",
    ()=>createSectionItem,
    "deletePage",
    ()=>deletePage,
    "deletePageSection",
    ()=>deletePageSection,
    "deleteSectionItem",
    ()=>deleteSectionItem,
    "getFooterPages",
    ()=>getFooterPages,
    "getPage",
    ()=>getPage,
    "getPageBySlug",
    ()=>getPageBySlug,
    "getPageSections",
    ()=>getPageSections,
    "getPageWithSections",
    ()=>getPageWithSections,
    "getPages",
    ()=>getPages,
    "getSectionItems",
    ()=>getSectionItems,
    "updatePage",
    ()=>updatePage,
    "updatePageSection",
    ()=>updatePageSection,
    "updateSectionItem",
    ()=>updateSectionItem
]);
/**
 * queries/content.ts
 *
 * CRUD unificado para el sistema de contenido:
 *   pages → page_sections → section_items
 *
 * No contiene ningún dato específico de dominio (café u otro).
 * Los seeds del sitio concreto van en supabase/seeds/coffee_content.sql.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getPages() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').select('*').order('order_index');
    if (error) throw error;
    return data ?? [];
}
async function getFooterPages() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').select('key, label, slug').eq('enabled', true).eq('show_in_footer', true).order('order_index');
    if (error) throw error;
    return data ?? [];
}
async function getPage(key) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').select('*').eq('key', key).maybeSingle();
    if (error) throw error;
    return data;
}
async function getPageBySlug(slug) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').select('*').eq('slug', slug).eq('enabled', true).maybeSingle();
    if (error) throw error;
    return data;
}
async function getPageWithSections(slug, onlyEnabled = true) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    // 1. Fetch page
    const pageQuery = supabase.from('pages').select('*').eq('slug', slug);
    if (onlyEnabled) pageQuery.eq('enabled', true);
    const { data: pageData, error: pageError } = await pageQuery.maybeSingle();
    if (pageError) throw pageError;
    if (!pageData) return null;
    const page = pageData;
    // 2. Fetch sections
    const sectionsQuery = supabase.from('page_sections').select('*').eq('page_key', page.key).order('order_index');
    if (onlyEnabled) sectionsQuery.eq('enabled', true);
    const { data: sectionsData, error: sectionsError } = await sectionsQuery;
    if (sectionsError) throw sectionsError;
    const sections = sectionsData ?? [];
    if (sections.length === 0) return {
        ...page,
        sections: []
    };
    // 3. Fetch items for all sections in one query
    const sectionIds = sections.map((s)=>s.id);
    const itemsQuery = supabase.from('section_items').select('*').in('section_id', sectionIds).order('order_index');
    if (onlyEnabled) itemsQuery.eq('enabled', true);
    const { data: itemsData, error: itemsError } = await itemsQuery;
    if (itemsError) throw itemsError;
    const items = itemsData ?? [];
    // 4. Group items by section
    const itemsBySection = items.reduce((acc, item)=>{
        if (!acc[item.section_id]) acc[item.section_id] = [];
        acc[item.section_id].push(item);
        return acc;
    }, {});
    return {
        ...page,
        sections: sections.map((s)=>({
                ...s,
                items: itemsBySection[s.id] ?? []
            }))
    };
}
async function createPage(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').insert({
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updatePage(key, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('pages').update({
        ...input,
        updated_at: new Date().toISOString()
    }).eq('key', key).select().single();
    if (error) throw error;
    return data;
}
async function deletePage(key) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('pages').delete().eq('key', key);
    if (error) throw error;
}
async function getPageSections(pageKey, onlyEnabled = false) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('page_sections').select('*').eq('page_key', pageKey).order('order_index');
    if (onlyEnabled) query = query.eq('enabled', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}
async function createPageSection(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('page_sections').insert({
        ...input,
        settings: input.settings ?? {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updatePageSection(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { settings: rawSettings, ...rest } = input;
    const { data, error } = await supabase.from('page_sections').update({
        ...rest,
        ...rawSettings !== undefined && {
            settings: rawSettings
        },
        updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
async function deletePageSection(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('page_sections').delete().eq('id', id);
    if (error) throw error;
}
async function getSectionItems(sectionId, onlyEnabled = false) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('section_items').select('*').eq('section_id', sectionId).order('order_index');
    if (onlyEnabled) query = query.eq('enabled', true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}
async function createSectionItem(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { metadata, ...rest } = input;
    const { data, error } = await supabase.from('section_items').insert({
        ...rest,
        ...metadata !== undefined && {
            metadata: metadata
        },
        created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updateSectionItem(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { metadata, ...rest } = input;
    const { data, error } = await supabase.from('section_items').update({
        ...rest,
        ...metadata !== undefined && {
            metadata: metadata
        }
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
async function deleteSectionItem(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('section_items').delete().eq('id', id);
    if (error) throw error;
}
}),
"[project]/packages/database/src/queries/nav.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createNavItem",
    ()=>createNavItem,
    "deleteNavItem",
    ()=>deleteNavItem,
    "getAllNavItems",
    ()=>getAllNavItems,
    "getNavTree",
    ()=>getNavTree,
    "updateNavItem",
    ()=>updateNavItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getNavTree() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('nav_items').select('*').eq('enabled', true).order('order_index');
    if (error) throw error;
    const items = data ?? [];
    // Construir árbol: primero top-level, luego asignar hijos
    const topLevel = items.filter((i)=>i.parent_id === null);
    return topLevel.map((parent)=>({
            ...parent,
            children: items.filter((i)=>i.parent_id === parent.id)
        }));
}
async function getAllNavItems() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('nav_items').select('*').order('order_index');
    if (error) throw error;
    const items = data ?? [];
    const topLevel = items.filter((i)=>i.parent_id === null);
    return topLevel.map((parent)=>({
            ...parent,
            children: items.filter((i)=>i.parent_id === parent.id)
        }));
}
async function createNavItem(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('nav_items').insert({
        ...input,
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
async function updateNavItem(id, input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('nav_items').update({
        ...input,
        updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    if (error) throw error;
    return data;
}
async function deleteNavItem(id) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('nav_items').delete().eq('id', id);
    if (error) throw error;
}
}),
"[project]/packages/database/src/queries/media.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createMediaAsset",
    ()=>createMediaAsset,
    "deleteMediaAsset",
    ()=>deleteMediaAsset,
    "getMediaAssets",
    ()=>getMediaAssets,
    "updateMediaAssetAlt",
    ()=>updateMediaAssetAlt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
async function getMediaAssets(opts) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    let query = supabase.from('media_assets').select('*').order('created_at', {
        ascending: false
    });
    if (opts?.mimeType) query = query.eq('mime_type', opts.mimeType);
    if (opts?.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}
async function createMediaAsset(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('media_assets').insert({
        key: input.key,
        url: input.url,
        bucket: input.bucket ?? 'public',
        mime_type: input.mime_type,
        size_bytes: input.size_bytes,
        width_px: input.width_px,
        height_px: input.height_px,
        alt_text: input.alt_text,
        uploaded_by: input.uploaded_by,
        used_in: []
    }).select().single();
    if (error) throw error;
    return data;
}
async function deleteMediaAsset(key) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { error } = await supabase.from('media_assets').delete().eq('key', key);
    if (error) throw error;
}
async function updateMediaAssetAlt(key, altText) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('media_assets').update({
        alt_text: altText,
        updated_at: new Date().toISOString()
    }).eq('key', key).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/home.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getWebHomeData",
    ()=>getWebHomeData
]);
/**
 * queries/home.ts
 *
 * Datos de la página Home consolidados en una sola función.
 * Tras la migración 19 (CMS unificado), el home se gestiona
 * íntegramente desde page_sections + section_items, igual que
 * el resto de páginas del sitio.
 *
 * Los datos "dinámicos" (productos, blog, categorías) se siguen
 * cargando en paralelo desde sus propios módulos.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/products.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/blog.ts [app-route] (ecmascript)");
;
;
;
async function getWebHomeData() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    async function fetchHomeSections() {
        const { data: sections, error: sErr } = await supabase.from('page_sections').select('*').eq('page_key', 'home').order('order_index');
        if (sErr || !sections?.length) return [];
        const sectionIds = sections.map((s)=>s.id);
        const { data: items } = await supabase.from('section_items').select('*').in('section_id', sectionIds).eq('enabled', true).order('order_index');
        const bySection = (items ?? []).reduce((acc, item)=>{
            if (!acc[item.section_id]) acc[item.section_id] = [];
            acc[item.section_id].push(item);
            return acc;
        }, {});
        return sections.map((s)=>({
                ...s,
                items: bySection[s.id] ?? []
            }));
    }
    const [homeSections, featuredProducts, blogPosts, bestSellers, categories] = await Promise.all([
        fetchHomeSections().catch(()=>[]),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getFeaturedProducts"])(3).catch(()=>[]),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBlogPosts"])({
            limit: 2
        }).catch(()=>[]),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBestSellingProducts"])(4).catch(()=>[]),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCategories"])().catch(()=>[])
    ]);
    return {
        homeSections,
        featuredProducts,
        blogPosts,
        bestSellers,
        categories
    };
}
}),
"[project]/packages/database/src/queries/admin-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAdminConfig",
    ()=>getAdminConfig,
    "updateAdminConfig",
    ()=>updateAdminConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
;
const DEFAULT_ADMIN_CONFIG = {
    id: 1,
    accent_color: '#4F46E5',
    sidebar_color: '#0F172A',
    updated_at: new Date().toISOString()
};
async function getAdminConfig() {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('admin_config').select('*').limit(1).single();
    if (error || !data) return DEFAULT_ADMIN_CONFIG;
    return data;
}
async function updateAdminConfig(input) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])();
    const { data, error } = await supabase.from('admin_config')// eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({
        id: 1,
        ...input,
        updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
}
}),
"[project]/packages/database/src/queries/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/products.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/orders.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/blog.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/shipping-config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/store-config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$payment$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/payment-config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$profile$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/shipping-profile.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/coupons.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/cart.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/themes.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/variant-types.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/content.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/nav.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/media.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$home$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/home.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$admin$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/admin-config.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/packages/database/src/providers/email/ResendProvider.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ResendProvider",
    ()=>ResendProvider
]);
const RESEND_API_URL = 'https://api.resend.com/emails';
class ResendProvider {
    config;
    name;
    constructor(config){
        this.config = config;
        this.name = 'resend';
    }
    async send(payload) {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Resend error ${res.status}: ${err}`);
        }
    }
}
}),
"[project]/packages/database/src/providers/email/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEmailProvider",
    ()=>getEmailProvider
]);
/**
 * Email Provider Factory
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  store_config.email_provider  │  Returned provider         │
 * ├────────────────────────────────────────────────────────────┤
 * │  'resend' (default)           │  ResendProvider(apiKey)    │
 * │  <future>                     │  <future>Provider(config)  │
 * └────────────────────────────────────────────────────────────┘
 *
 * Adding a new provider:
 *   1. Create src/providers/email/<Name>Provider.ts implementing EmailProvider.
 *   2. Add its credentials to store_config (migration + types.ts).
 *   3. Add a case below.
 *   4. Add option + credentials form in admin email config UI.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$email$2f$ResendProvider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/email/ResendProvider.ts [app-route] (ecmascript)");
;
;
function getEmailProvider(config) {
    const provider = config.provider ?? 'resend';
    switch(provider){
        case 'resend':
        default:
            return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$email$2f$ResendProvider$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ResendProvider"]({
                apiKey: config.apiKey
            });
    }
}
}),
"[project]/packages/database/src/lib/email.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendShippingNotification",
    ()=>sendShippingNotification,
    "sendStatusNotification",
    ()=>sendStatusNotification
]);
/**
 * Utilidades de email transaccional compartidas entre apps/web y apps/admin.
 * Usa la abstracción EmailProvider — por defecto ResendProvider.
 *
 * Las funciones específicas de cada app (sendOrderConfirmation, sendWelcomeEmail,
 * sendNewsletterConfirmation, buildEmailConfig) permanecen en cada app.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$email$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/providers/email/index.ts [app-route] (ecmascript) <locals>");
;
async function sendEmail(config, payload) {
    const provider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$email$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getEmailProvider"])({
        provider: config.emailProvider,
        apiKey: config.apiKey
    });
    await provider.send(payload);
}
function baseTemplate(content, config) {
    const name = config.storeName ?? 'Mi Tienda';
    const url = (config.siteUrl ?? '').replace(/\/$/, '');
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff8ec;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: #614a2a; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">${name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">${content}</td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                ${name}${url ? ` · <a href="${url}" style="color: #614a2a;">${url.replace(/^https?:\/\//, '')}</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
async function sendShippingNotification(order, config) {
    const name = config.storeName ?? 'Mi Tienda';
    const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Tu pedido está en camino!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu pedido <strong>${order.order_number}</strong> ha sido despachado.
    </p>
    ${order.tracking_number ? `
    <div style="background: #fff8ec; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Número de tracking</p>
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: monospace;">${order.tracking_number}</p>
      ${order.carrier_name ? `<p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Transportadora: <strong>${order.carrier_name}</strong></p>` : ''}
    </div>
    ${order.label_url ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${order.label_url}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Descargar guía de envío
      </a>
    </div>` : ''}` : ''}
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`;
    await sendEmail(config, {
        from: `${name} <${config.fromEmail}>`,
        to: [
            order.customer_email
        ],
        subject: `Tu pedido ${order.order_number} ha sido despachado — ${name}`,
        html: baseTemplate(content, config)
    });
}
async function sendStatusNotification(order, status, config) {
    const name = config.storeName ?? 'Mi Tienda';
    const isDelivered = status === 'delivered';
    const heading = isDelivered ? '¡Tu pedido fue entregado!' : 'Tu pedido ha sido cancelado';
    const body = isDelivered ? `Tu pedido <strong>${order.order_number}</strong> fue marcado como entregado. Esperamos que disfrutes tu compra.` : `Tu pedido <strong>${order.order_number}</strong> ha sido cancelado. Si tienes dudas, contáctanos.`;
    const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">${heading}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">${body}</p>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`;
    const subjects = {
        delivered: `Pedido ${order.order_number} entregado — ${name}`,
        cancelled: `Pedido ${order.order_number} cancelado — ${name}`
    };
    await sendEmail(config, {
        from: `${name} <${config.fromEmail}>`,
        to: [
            order.customer_email
        ],
        subject: subjects[status],
        html: baseTemplate(content, config)
    });
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/packages/database/src/providers/payment/WompiGateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WompiGateway",
    ()=>WompiGateway
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/';
class WompiGateway {
    config;
    name;
    constructor(config){
        this.config = config;
        this.name = 'wompi';
    }
    async createPaymentUrl(params) {
        const currency = params.currency ?? 'COP';
        const signature = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(`${params.orderNumber}${params.amountInCents}${currency}${this.config.integritySecret}`).digest('hex');
        const url = new URL(WOMPI_CHECKOUT_BASE);
        url.searchParams.set('public-key', this.config.publicKey);
        url.searchParams.set('currency', currency);
        url.searchParams.set('amount-in-cents', String(params.amountInCents));
        url.searchParams.set('reference', params.orderNumber);
        url.searchParams.set('redirect-url', params.redirectUrl);
        url.searchParams.set('signature:integrity', signature);
        if (params.customerEmail) {
            url.searchParams.set('customer-data:email', params.customerEmail);
        }
        if (params.customerName) {
            url.searchParams.set('customer-data:full-name', params.customerName);
        }
        if (params.customerPhone) {
            url.searchParams.set('customer-data:phone-number', params.customerPhone);
        }
        return url.toString();
    }
    verifyWebhook(rawBody, headers) {
        const eventsSecret = this.config.eventsSecret ?? '';
        if (!eventsSecret) {
            console.warn('[WompiGateway] eventsSecret vacío — omitiendo verificación de firma');
            return true;
        }
        const timestamp = headers['x-timestamp'] ?? '';
        const checksum = headers['x-checksum'] ?? '';
        const expected = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(`${rawBody}${timestamp}${eventsSecret}`).digest('hex');
        return expected === checksum;
    }
    mapStatus(rawStatus) {
        const map = {
            APPROVED: 'approved',
            DECLINED: 'rejected',
            ERROR: 'rejected',
            VOIDED: 'rejected',
            PENDING: 'pending'
        };
        return map[rawStatus] ?? 'pending';
    }
    extractWebhookData(body) {
        const event = body;
        if (event.event !== 'transaction.updated') return null;
        const data = event.data;
        const transaction = data?.transaction;
        if (!transaction) return null;
        const orderReference = transaction.reference;
        const rawStatus = transaction.status;
        const paymentId = transaction.id;
        if (!orderReference || !rawStatus) return null;
        return {
            orderReference,
            rawStatus,
            paymentId
        };
    }
}
}),
"[project]/packages/database/src/providers/payment/MercadoPagoGateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MercadoPagoGateway",
    ()=>MercadoPagoGateway
]);
const MP_API_BASE = 'https://api.mercadopago.com';
class MercadoPagoGateway {
    config;
    name;
    constructor(config){
        this.config = config;
        this.name = 'mercadopago';
    }
    async createPaymentUrl(params) {
        // Derive origin URL for back_urls failure redirect
        let failureUrl = `${params.redirectUrl.split('/checkout')[0]}/checkout?error=pago_rechazado`;
        try {
            const origin = new URL(params.redirectUrl).origin;
            failureUrl = `${origin}/checkout?error=pago_rechazado`;
        } catch  {}
        const body = {
            external_reference: params.orderNumber,
            items: params.items.map((item)=>({
                    id: item.id,
                    title: item.title,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    currency_id: params.currency ?? 'COP'
                })),
            payer: {
                email: params.customerEmail
            },
            back_urls: {
                success: params.redirectUrl,
                failure: failureUrl,
                pending: `${params.redirectUrl}&status=pending`
            },
            auto_return: 'approved',
            notification_url: params.webhookUrl
        };
        const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.accessToken}`
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`MercadoPago API error ${res.status}: ${err}`);
        }
        const preference = await res.json();
        const isSandbox = this.config.accessToken.startsWith('TEST-');
        return isSandbox ? preference.sandbox_init_point : preference.init_point;
    }
    /**
   * MercadoPago does not use a webhook signature in the same way as Wompi.
   * Verification is done by fetching the payment from the API and comparing
   * the external_reference — handled in extractWebhookData + getPayment.
   */ verifyWebhook(_rawBody, _headers) {
        return true;
    }
    mapStatus(rawStatus) {
        const map = {
            approved: 'approved',
            authorized: 'approved',
            rejected: 'rejected',
            cancelled: 'rejected',
            refunded: 'rejected',
            charged_back: 'rejected',
            pending: 'pending',
            in_process: 'pending',
            in_mediation: 'pending'
        };
        return map[rawStatus] ?? 'pending';
    }
    extractWebhookData(body) {
        const event = body;
        if (event.type !== 'payment') return null;
        const data = event.data;
        const paymentId = data?.id;
        if (!paymentId) return null;
        // Full details (orderReference + rawStatus) fetched via getPayment()
        return {
            orderReference: '',
            rawStatus: '',
            paymentId: String(paymentId)
        };
    }
    /**
   * Fetches full payment details from MercadoPago API.
   * Used by the webhook handler to get orderReference and rawStatus.
   */ async getPayment(paymentId) {
        const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
            headers: {
                Authorization: `Bearer ${this.config.accessToken}`
            }
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`MercadoPago payment fetch error ${res.status}: ${err}`);
        }
        const data = await res.json();
        return {
            orderReference: data.external_reference,
            rawStatus: data.status,
            amount: data.transaction_amount
        };
    }
}
}),
"[project]/packages/database/src/providers/payment/TuCompraGateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TuCompraGateway",
    ()=>TuCompraGateway
]);
/**
 * TuCompraGateway — integración con Tu Compra (pasarela colombiana)
 * Documentación: https://docs.tucompra.com.co/
 *
 * Flujo:
 *   1. POST a la URL del botón de pago con firma MD5
 *   2. Tu Compra redirige al cliente al formulario de pago
 *   3. Tu Compra llama al webhook con el resultado
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const PROD_URL = 'https://checkout.tucompra.com.co/tc/app/inputs/factura.php';
const SANDBOX_URL = 'https://dev.tucompra.com.co/tc/app/inputs/factura.php';
class TuCompraGateway {
    cfg;
    name;
    constructor(cfg){
        this.cfg = cfg;
        this.name = 'tucompra';
    }
    /**
   * Builds the Tu Compra hosted checkout URL.
   * Tu Compra accepts a POST form but also supports GET with params.
   * We return a URL the client can redirect to.
   */ async createPaymentUrl(params) {
        const baseUrl = this.cfg.sandbox ? SANDBOX_URL : PROD_URL;
        const amount = (params.amountInCents / 100).toFixed(2);
        const orderId = params.orderNumber;
        // Signature: MD5(merchantId + orderId + amount + currency + secretKey)
        const rawSig = `${this.cfg.merchantId}${orderId}${amount}${params.currency}${this.cfg.secretKey}`;
        const firma = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('md5').update(rawSig).digest('hex');
        const query = new URLSearchParams({
            empresa: this.cfg.merchantId,
            factura: orderId,
            monto: amount,
            moneda: params.currency,
            descripcion: `Pedido ${orderId}`,
            nombre_cliente: params.customerName,
            correo_cliente: params.customerEmail,
            celular: params.customerPhone ?? '',
            url_respuesta: params.redirectUrl,
            url_confirmacion: params.webhookUrl,
            firma
        });
        return `${baseUrl}?${query.toString()}`;
    }
    /**
   * Tu Compra sends webhooks via POST form.
   * Basic verification using MD5 signature in the payload.
   */ verifyWebhook(rawBody, _headers) {
        try {
            const params = new URLSearchParams(rawBody);
            const firma = params.get('firma') ?? '';
            const factura = params.get('factura') ?? '';
            const monto = params.get('monto') ?? '';
            const moneda = params.get('moneda') ?? 'COP';
            const resultado = params.get('resultado') ?? '';
            const expected = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('md5').update(`${this.cfg.merchantId}${factura}${monto}${moneda}${resultado}${this.cfg.secretKey}`).digest('hex');
            return expected === firma;
        } catch  {
            return false;
        }
    }
    mapStatus(rawStatus) {
        // Tu Compra: 1=approved, 2=rejected, 3=pending, 4=cancelled
        switch(rawStatus){
            case '1':
                return 'approved';
            case '3':
                return 'pending';
            default:
                return 'rejected';
        }
    }
    extractWebhookData(body) {
        try {
            const params = body instanceof URLSearchParams ? body : new URLSearchParams(String(body));
            const orderReference = params.get('factura');
            const rawStatus = params.get('resultado');
            const paymentId = params.get('ref_payco') ?? params.get('transaccion') ?? undefined;
            if (!orderReference || rawStatus === null) return null;
            return {
                orderReference,
                rawStatus,
                paymentId: paymentId ?? undefined
            };
        } catch  {
            return null;
        }
    }
}
}),
"[project]/packages/database/src/providers/payment/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Payment Gateway Factory
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  method        │  Gateway               │  Active field           │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  'wompi'       │  WompiGateway          │  wompi_active           │
 * │  'mercadopago' │  MercadoPagoGateway    │  mercadopago_active     │
 * │  'tucompra'    │  TuCompraGateway       │  tucompra_active        │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Adding a new gateway:
 *   1. Create src/providers/payment/<Name>Gateway.ts implementing PaymentGateway.
 *   2. Add credentials to payment_config (migration + types.ts).
 *   3. Add a case below.
 *   4. Add toggle + form in admin PaymentConfigForm.
 */ __turbopack_context__.s([
    "getActiveGateways",
    ()=>getActiveGateways,
    "getPaymentGateway",
    ()=>getPaymentGateway
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$WompiGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/WompiGateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$MercadoPagoGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/MercadoPagoGateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$TuCompraGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/TuCompraGateway.ts [app-route] (ecmascript)");
;
;
;
;
;
;
function getPaymentGateway(method, config) {
    switch(method){
        case 'wompi':
            {
                if (!config.wompi_active) {
                    throw new Error('Wompi no está activo. Actívalo en Configuración → Pagos.');
                }
                if (!config.wompi_public_key || !config.wompi_integrity_secret) {
                    throw new Error('Wompi: faltan credenciales (public_key o integrity_secret).');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$WompiGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WompiGateway"]({
                    publicKey: config.wompi_public_key,
                    integritySecret: config.wompi_integrity_secret,
                    eventsSecret: config.wompi_events_secret ?? undefined
                });
            }
        case 'mercadopago':
            {
                if (!config.mercadopago_active) {
                    throw new Error('MercadoPago no está activo. Actívalo en Configuración → Pagos.');
                }
                if (!config.mercadopago_access_token) {
                    throw new Error('MercadoPago: falta el access token.');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$MercadoPagoGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MercadoPagoGateway"]({
                    accessToken: config.mercadopago_access_token,
                    publicKey: config.mercadopago_public_key ?? undefined
                });
            }
        case 'tucompra':
            {
                if (!config.tucompra_active) {
                    throw new Error('Tu Compra no está activo. Actívalo en Configuración → Pagos.');
                }
                if (!config.tucompra_merchant_id || !config.tucompra_secret_key) {
                    throw new Error('Tu Compra: faltan credenciales (merchant_id o secret_key).');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$TuCompraGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TuCompraGateway"]({
                    merchantId: config.tucompra_merchant_id,
                    secretKey: config.tucompra_secret_key,
                    sandbox: config.tucompra_sandbox ?? true
                });
            }
        default:
            throw new Error(`Pasarela de pago desconocida: "${method}"`);
    }
}
function getActiveGateways(config) {
    const active = [];
    if (config.wompi_active && config.wompi_public_key && config.wompi_integrity_secret) {
        active.push('wompi');
    }
    if (config.mercadopago_active && config.mercadopago_access_token) {
        active.push('mercadopago');
    }
    if (config.tucompra_active && config.tucompra_merchant_id && config.tucompra_secret_key) {
        active.push('tucompra');
    }
    return active;
}
}),
"[project]/packages/database/src/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/queries/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/lib/email.ts [app-route] (ecmascript)");
// ─── Provider abstractions ────────────────────────────────────────────────────
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$email$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/providers/email/index.ts [app-route] (ecmascript) <locals>");
;
;
;
;
;
;
}),
"[project]/apps/web/src/lib/shipping/providers/fixed-rate.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * FixedRateProvider
 *
 * The default shipping provider. Returns a single flat-rate option
 * (configurable from the admin panel) without calling any external API.
 *
 * Used:
 *   - When no external provider is configured.
 *   - As a fallback when the active provider fails (timeout, auth error, etc.).
 *   - In development / staging to avoid consuming API quota.
 */ __turbopack_context__.s([
    "FixedRateProvider",
    ()=>FixedRateProvider
]);
class FixedRateProvider {
    rate;
    name;
    constructor(/** Flat shipping cost in COP (from shipping_config.fixed_rate) */ rate = 8000){
        this.rate = rate;
        this.name = 'fixed';
    }
    async getRates(_address, _parcel) {
        // If rate is 0 it means free shipping — still return a rate object
        // so the checkout UI has something to display.
        return [
            {
                id: 'fixed-rate',
                provider: this.name,
                carrier_name: 'Tarifa fija',
                service_name: this.rate === 0 ? 'Envío gratuito' : 'Envío estándar',
                currency: 'COP',
                total_price: this.rate,
                days: 5,
                estimated_delivery: undefined
            }
        ];
    }
}
}),
"[project]/apps/web/src/lib/shipping/providers/skydropx/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Skydropx OAuth 2.0 token management.
 *
 * Credentials are passed as arguments (loaded from shipping_config in the DB),
 * not from environment variables. This allows runtime reconfiguration without
 * redeployment.
 *
 * Token cache is keyed by clientId so multiple Skydropx accounts (multi-tenant)
 * are supported and warm serverless instances don't share stale tokens across configs.
 */ __turbopack_context__.s([
    "_clearTokenCacheForTests",
    ()=>_clearTokenCacheForTests,
    "getSkydropxToken",
    ()=>getSkydropxToken,
    "skydropxFetch",
    ()=>skydropxFetch
]);
// Module-level cache: Map<clientId, { access_token, expires_at }>
const tokenCache = new Map();
async function getSkydropxToken(credentials) {
    const { clientId, clientSecret, baseUrl = 'https://api-pro.skydropx.com' } = credentials;
    const now = Date.now() / 1000;
    const cached = tokenCache.get(clientId);
    // Reuse if valid with at least 60-second margin
    if (cached && cached.expires_at > now + 60) {
        return cached.access_token;
    }
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
    });
    const res = await fetch(`${baseUrl}/api/v1/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
    if (!res.ok) {
        throw new Error(`Skydropx auth failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const entry = {
        access_token: data.access_token,
        expires_at: data.created_at + data.expires_in
    };
    tokenCache.set(clientId, entry);
    return entry.access_token;
}
async function skydropxFetch(path, credentials, options = {}) {
    const { baseUrl = 'https://api-pro.skydropx.com' } = credentials;
    const token = await getSkydropxToken(credentials);
    return fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });
}
function _clearTokenCacheForTests() {
    tokenCache.clear();
}
}),
"[project]/apps/web/src/lib/shipping/providers/skydropx/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SkydropxProvider",
    ()=>SkydropxProvider
]);
/**
 * SkydropxProvider — Skydropx PRO API (OAuth 2.0, app.skydropx.com)
 *
 * Implements ShippingProvider (getRates) and adds createShipment for
 * post-payment label generation.
 *
 * Quotation flow (async):
 *   POST /api/v1/quotations → poll GET until is_completed → pick cheapest rate
 *
 * Shipment flow:
 *   POST /api/v1/shipments with rate_id → extract tracking_number + label_url from included[0]
 *
 * Rate format differences (PRO API vs legacy):
 *   PRO field           → internal field
 *   id                  → id  (rate_id for shipment creation)
 *   provider_name       → carrier_name
 *   provider_service_name → service_name
 *   currency_code       → currency
 *   total               → total_price
 *   days                → days
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/shipping/providers/skydropx/auth.ts [app-route] (ecmascript)");
;
class SkydropxProvider {
    config;
    name;
    constructor(config){
        this.config = config;
        this.name = 'skydropx';
    }
    // ── ShippingProvider interface ─────────────────────────────────────────────
    async getRates(address, parcel) {
        try {
            const quotationId = await this._createQuotation(address, parcel);
            const proRates = await this._pollRates(quotationId);
            return proRates.filter((r)=>r.success).map((r)=>({
                    id: r.id,
                    provider: this.name,
                    carrier_name: r.provider_display_name ?? r.provider_name,
                    service_name: r.provider_service_name,
                    currency: r.currency_code,
                    total_price: Number(r.total),
                    days: r.days,
                    estimated_delivery: r.estimated_delivery
                }));
        } catch (err) {
            console.error('[SkydropxProvider] getRates error:', err);
            return [];
        }
    }
    // ── Shipment creation ──────────────────────────────────────────────────────
    /**
   * Creates a shipping label for the given destination address and parcel.
   * Internally: creates a quotation, polls for rates, picks the cheapest,
   * then creates the shipment and extracts tracking_number + label_url.
   */ async createShipment(destination, parcel) {
        // 1. Get cheapest rate
        const quotationId = await this._createQuotation(destination, parcel);
        const proRates = await this._pollRates(quotationId);
        const successRates = proRates.filter((r)=>r.success);
        if (!successRates.length) throw new Error('No hay tarifas disponibles de Skydropx');
        const cheapest = successRates.reduce((a, b)=>Number(a.total) <= Number(b.total) ? a : b);
        // 2. Create shipment
        const { origin } = this.config;
        const body = {
            shipment: {
                rate_id: cheapest.id,
                printing_format: 'thermal',
                address_from: {
                    name: origin.name,
                    street1: origin.street,
                    city: origin.city,
                    province: origin.department,
                    zip: origin.postalCode,
                    country_code: 'CO',
                    phone: origin.phone,
                    email: origin.email
                },
                address_to: {
                    name: destination.name,
                    street1: destination.street1,
                    city: destination.area_level2,
                    province: destination.area_level1,
                    zip: destination.postal_code,
                    country_code: 'CO',
                    phone: destination.phone,
                    email: destination.email,
                    ...destination.reference ? {
                        reference: destination.reference
                    } : {}
                },
                parcels: [
                    {
                        weight: parcel.weight,
                        length: parcel.length,
                        width: parcel.width,
                        height: parcel.height
                    }
                ]
            }
        };
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["skydropxFetch"])('/api/v1/shipments', this.config, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Skydropx createShipment failed ${res.status}: ${text}`);
        }
        const data = await res.json();
        // Tracking and label live in included[0].attributes (not data.attributes)
        const pkg = data.included?.[0]?.attributes;
        const trackingNumber = pkg?.tracking_number ?? data.data?.attributes?.tracking_number ?? '';
        const labelUrl = pkg?.label_url ?? data.data?.attributes?.label_url ?? '';
        const shipmentId = data.data?.id ?? '';
        return {
            shipmentId,
            trackingNumber,
            labelUrl,
            carrierName: cheapest.provider_display_name ?? cheapest.provider_name,
            serviceName: cheapest.provider_service_name,
            total: Number(cheapest.total)
        };
    }
    // ── Private helpers ────────────────────────────────────────────────────────
    async _createQuotation(address, parcel) {
        const { origin } = this.config;
        const body = {
            quotation: {
                address_from: {
                    country_code: 'CO',
                    area_level1: origin.department,
                    area_level2: origin.city,
                    // postal_code omitted — Skydropx CO works with area_level1+area_level2 only
                    ...origin.neighborhood ? {
                        area_level3: origin.neighborhood
                    } : {}
                },
                address_to: {
                    country_code: 'CO',
                    area_level1: address.area_level1,
                    area_level2: address.area_level2,
                    // postal_code omitted — Skydropx CO rejects unrecognised codes
                    ...address.area_level3 ? {
                        area_level3: address.area_level3
                    } : {}
                },
                parcel: {
                    weight: parcel.weight,
                    length: parcel.length,
                    width: parcel.width,
                    height: parcel.height
                },
                // Required by Skydropx PRO — declared value of goods in COP
                declared_amount: parcel.declaredAmount ?? 50000
            }
        };
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["skydropxFetch"])('/api/v1/quotations', this.config, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const errBody = await res.text().catch(()=>'(no body)');
            throw new Error(`Skydropx createQuotation failed: ${res.status} — ${errBody}`);
        }
        const data = await res.json();
        // PRO API returns { id, is_completed, ... } directly
        return data.id ?? data.data?.id;
    }
    async _pollRates(quotationId) {
        const MAX_ATTEMPTS = 15;
        const DELAY_MS = 600;
        for(let i = 0; i < MAX_ATTEMPTS; i++){
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["skydropxFetch"])(`/api/v1/quotations/${quotationId}`, this.config);
            const data = await res.json();
            // PRO API: { id, is_completed, rates: [...] }
            // Legacy:  { data: { attributes: { is_completed, rates: [...] } } }
            const isCompleted = data.is_completed ?? data.data?.attributes?.is_completed;
            const rates = data.rates ?? data.data?.attributes?.rates;
            if (isCompleted) {
                return rates ?? [];
            }
            await new Promise((r)=>setTimeout(r, DELAY_MS));
        }
        throw new Error(`Skydropx quotation ${quotationId} did not complete in time`);
    }
}
}),
"[project]/apps/web/src/lib/shipping/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getShippingProvider",
    ()=>getShippingProvider
]);
/**
 * Shipping Provider Factory
 *
 * Reads the active shipping configuration from the database and returns
 * the appropriate ShippingProvider instance.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  shipping_config.provider  │  Returned provider              │
 * ├──────────────────────────────────────────────────────────────┤
 * │  'fixed'                   │  FixedRateProvider(fixed_rate)  │
 * │  'skydropx' + credentials  │  SkydropxProvider(credentials)  │
 * │  'skydropx' + missing creds│  FixedRateProvider (fallback)   │
 * │  DB error / no row         │  FixedRateProvider(8000)        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Adding a new provider:
 *   1. Add the slug to `shipping_provider_type` enum in the DB migration.
 *   2. Add columns for its credentials to `shipping_config`.
 *   3. Create `src/lib/shipping/providers/<name>/index.ts` implementing ShippingProvider.
 *   4. Add a case to the switch below.
 *   5. Update the admin configuración UI.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/shipping-config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$fixed$2d$rate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/shipping/providers/fixed-rate.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/shipping/providers/skydropx/index.ts [app-route] (ecmascript)");
;
;
;
;
;
async function getShippingProvider() {
    let config;
    try {
        config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getShippingConfig"])();
    } catch  {
        console.warn('[shipping] Could not load shipping_config — using fixed rate fallback');
        return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$fixed$2d$rate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FixedRateProvider"](8000);
    }
    switch(config.provider){
        case 'skydropx':
            {
                const { skydropx_client_id, skydropx_client_secret, skydropx_base_url, origin_name, origin_street, origin_neighborhood, origin_city, origin_department, origin_postal_code, origin_phone, origin_email } = config;
                if (!skydropx_client_id || !skydropx_client_secret) {
                    console.warn('[shipping] Skydropx: faltan credenciales — usando tarifa fija');
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$fixed$2d$rate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FixedRateProvider"](config.fixed_rate);
                }
                // postal_code is optional — Skydropx accepts area_level1+area_level2 without it
                const hasOrigin = origin_name && origin_street && origin_city && origin_department && origin_phone && origin_email;
                if (!hasOrigin) {
                    console.warn('[shipping] Skydropx: dirección de origen incompleta — usando tarifa fija');
                    return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$fixed$2d$rate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FixedRateProvider"](config.fixed_rate);
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$skydropx$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SkydropxProvider"]({
                    clientId: skydropx_client_id,
                    clientSecret: skydropx_client_secret,
                    baseUrl: skydropx_base_url ?? 'https://api-pro.skydropx.com',
                    origin: {
                        name: origin_name,
                        street: origin_street,
                        neighborhood: origin_neighborhood ?? '',
                        city: origin_city,
                        department: origin_department,
                        postalCode: origin_postal_code,
                        phone: origin_phone,
                        email: origin_email
                    }
                });
            }
        // 'fixed' and any unknown future value → FixedRateProvider
        default:
            return new __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$providers$2f$fixed$2d$rate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["FixedRateProvider"](config.fixed_rate);
    }
}
}),
"[project]/apps/web/src/lib/shipping/types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Core shipping abstraction types.
 *
 * Any shipping provider (Skydropx, FedEx, Deprisa, fixed-rate, etc.)
 * must implement the `ShippingProvider` interface and return `ShippingRate[]`.
 * The rest of the application only depends on these types, never on a
 * specific provider implementation.
 */ // ─── Address & Parcel ─────────────────────────────────────────────────────────
__turbopack_context__.s([
    "calculateParcel",
    ()=>calculateParcel
]);
function calculateParcel(items) {
    // Legacy weight-string → kg map. Only used when weight_kg is not set on the variant.
    // These values are left for backwards compatibility with old cart items stored in
    // localStorage. New variants should always have weight_kg configured.
    // Unknown strings fall back to 0.5 kg.
    const LEGACY_WEIGHT_MAP = {
        '250g': 0.3,
        '500g': 0.6,
        '1kg': 1.1,
        '2kg': 2.1
    };
    // Total weight: use weight_kg when available, else fall back to legacy label
    const totalWeight = items.reduce((sum, item)=>{
        const kg = item.weight_kg != null && item.weight_kg > 0 ? item.weight_kg : LEGACY_WEIGHT_MAP[item.weight ?? ''] ?? 0.5;
        return sum + kg * item.qty;
    }, 0);
    // Use real dimensions if ALL items with qty > 0 have them set
    const hasRealDimensions = items.filter((i)=>i.qty > 0).every((i)=>i.length_cm && i.width_cm && i.height_cm);
    if (hasRealDimensions && items.length > 0) {
        // Total box = max dimensions across all items (single shipment box)
        const length = Math.max(...items.map((i)=>i.length_cm ?? 0));
        const width = Math.max(...items.map((i)=>i.width_cm ?? 0));
        const height = Math.max(...items.map((i)=>i.height_cm ?? 0));
        return {
            length,
            width,
            height,
            weight: totalWeight
        };
    }
    // Fallback: size tiers based on total weight
    if (totalWeight <= 0.7) return {
        length: 20,
        width: 15,
        height: 8,
        weight: totalWeight
    };
    if (totalWeight <= 1.5) return {
        length: 25,
        width: 20,
        height: 10,
        weight: totalWeight
    };
    return {
        length: 35,
        width: 25,
        height: 15,
        weight: totalWeight
    };
}
}),
"[project]/apps/web/src/app/api/shipping/rates/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/apps/web/src/lib/shipping/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/shipping/types.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    try {
        const { address, items } = await req.json();
        const shippingAddress = {
            name: address.name,
            street1: address.street,
            postal_code: address.postal_code ?? '',
            area_level1: address.department,
            area_level2: address.city,
            country_code: 'CO',
            phone: address.phone,
            email: address.email,
            reference: address.reference
        };
        const parcel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateParcel"])(items);
        // Declared value required by Skydropx PRO — sum of (price × qty)
        const rawDeclared = items.reduce((sum, i)=>sum + (i.price ?? 0) * i.qty, 0);
        parcel.declaredAmount = rawDeclared >= 1000 ? rawDeclared : 50000; // safety floor
        // Factory reads provider + credentials from shipping_config in the DB
        const provider = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$shipping$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getShippingProvider"])();
        const rates = await provider.getRates(shippingAddress, parcel);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            provider: provider.name,
            rates
        });
    } catch (err) {
        console.error('[api/shipping/rates]', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Error calculando tarifas de envío'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0fitehp._.js.map