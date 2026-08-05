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
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/web/src/stack.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "stackServerApp",
    ()=>stackServerApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$interfaces$2f$server$2d$app$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/stack-app/apps/interfaces/server-app.js [app-route] (ecmascript)");
;
const stackServerApp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$stack$2d$app$2f$apps$2f$interfaces$2f$server$2d$app$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["StackServerApp"]({
    tokenStore: 'nextjs-cookie',
    projectId: ("TURBOPACK compile-time value", "63f312c9-977d-4282-bc87-a226943f0013"),
    publishableClientKey: ("TURBOPACK compile-time value", "pck_39gsdrzx5b7k321223yqepm7wjznf95vgbqfx6dxghp4g"),
    secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY,
    urls: {
        signIn: '/login',
        signUp: '/registro',
        afterSignIn: '/mi-cuenta',
        afterSignUp: '/mi-cuenta',
        afterSignOut: '/',
        // Rutas explícitas del handler para que los emails apunten al lugar correcto
        passwordReset: '/handler/password-reset',
        forgotPassword: '/recuperar-contrasena',
        emailVerification: '/handler/email-verification',
        magicLinkCallback: '/handler/magic-link'
    }
});
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
        'tucompra_secret_key',
        'bold_api_key',
        'bold_secret_key'
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
    "sendPaymentConfirmed",
    ()=>sendPaymentConfirmed,
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
async function sendPaymentConfirmed(order, config) {
    const name = config.storeName ?? 'Mi Tienda';
    const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Confirmamos tu pago!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Verificamos el pago de tu pedido <strong>${order.order_number}</strong> y ya está en preparación.
      Te avisaremos cuando sea despachado.
    </p>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`;
    await sendEmail(config, {
        from: `${name} <${config.fromEmail}>`,
        to: [
            order.customer_email
        ],
        subject: `Pago confirmado — Pedido ${order.order_number} · ${name}`,
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
"[project]/packages/database/src/providers/payment/BoldGateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BoldGateway",
    ()=>BoldGateway
]);
/**
 * BoldGateway — integración con Bold (pasarela colombiana).
 * Documentación: https://developers.bold.co/pagos-en-linea/api-integration
 *                https://developers.bold.co/webhook
 *
 * Flujo (API "Link de pagos"):
 *   1. POST /online/link/v1 con `Authorization: x-api-key <api_key>` → devuelve payload.url
 *   2. Se redirige al cliente a payload.url (checkout.bold.co/LNK_…)
 *   3. Bold notifica el resultado por webhook (firmado con HMAC-SHA256)
 *
 * Correlación del pedido: se envía `metadata.reference = order_number` al crear el
 * link; el webhook lo devuelve en `data.metadata.reference`.
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
const BASE_URL = 'https://integrations.api.bold.co';
class BoldGateway {
    cfg;
    name;
    constructor(cfg){
        this.cfg = cfg;
        this.name = 'bold';
    }
    /**
   * Crea un link de pago cerrado (CLOSE) y devuelve la URL de checkout de Bold.
   * El total va en COP (no centavos); `amountInCents` viene en centavos.
   */ async createPaymentUrl(params) {
        const totalCop = Math.round(params.amountInCents / 100);
        const body = {
            amount_type: 'CLOSE',
            amount: {
                currency: params.currency || 'COP',
                total_amount: totalCop
            },
            description: `Pedido ${params.orderNumber}`,
            // Bold redirige aquí tras finalizar; conservamos el order para la confirmación
            callback_url: params.redirectUrl,
            payer_email: params.customerEmail,
            // Se devuelve en el webhook como data.metadata.reference → correlación del pedido
            metadata: {
                reference: params.orderNumber
            }
        };
        const res = await fetch(`${BASE_URL}/online/link/v1`, {
            method: 'POST',
            headers: {
                Authorization: `x-api-key ${this.cfg.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const text = await res.text().catch(()=>'(sin cuerpo)');
            throw new Error(`Bold createLink falló ${res.status}: ${text}`);
        }
        const data = await res.json();
        const url = data.payload?.url;
        if (!url) {
            throw new Error(`Bold createLink: respuesta sin payload.url (${JSON.stringify(data.errors ?? [])})`);
        }
        return url;
    }
    /**
   * Verifica la firma del webhook de Bold:
   *   HMAC-SHA256( base64(rawBody), secretKey ) en hex === header x-bold-signature
   * En sandbox la llave secreta es un string vacío.
   */ verifyWebhook(rawBody, headers) {
        try {
            const signature = headers['x-bold-signature'] ?? headers['X-Bold-Signature'] ?? '';
            if (!signature) return false;
            const secret = this.cfg.sandbox ? '' : this.cfg.secretKey;
            const encoded = Buffer.from(rawBody, 'utf-8').toString('base64');
            const hashed = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHmac"])('sha256', secret).update(encoded).digest('hex');
            const a = Buffer.from(hashed);
            const b = Buffer.from(signature);
            if (a.length !== b.length) return false;
            return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["timingSafeEqual"])(a, b);
        } catch  {
            return false;
        }
    }
    /**
   * Servicio de fallback de Bold: consulta el último estado de una transacción
   * por la referencia externa (nuestro order_number), útil cuando el webhook no
   * llega. Debe usarse SOLO como respaldo (Bold bloquea por exceso de peticiones).
   *
   * GET /payments/webhook/notifications/<ref>?is_external_reference=true
   * Devuelve el estado mapeado (priorizando SALE_APPROVED) o null si no hay datos.
   */ async queryStatusByReference(reference) {
        try {
            const url = `${BASE_URL}/payments/webhook/notifications/${encodeURIComponent(reference)}?is_external_reference=true`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `x-api-key ${this.cfg.apiKey}`
                }
            });
            if (!res.ok) return null;
            const data = await res.json();
            const list = data.notifications ?? [];
            if (!list.length) return null;
            // Preferimos una venta aprobada; si no, la última notificación recibida.
            const approved = list.find((n)=>n.type === 'SALE_APPROVED');
            const chosen = approved ?? list[list.length - 1];
            const rawStatus = chosen?.type ?? '';
            if (!rawStatus) return null;
            return {
                status: this.mapStatus(rawStatus),
                rawStatus,
                paymentId: chosen?.data?.payment_id ?? chosen?.subject ?? undefined
            };
        } catch  {
            return null;
        }
    }
    mapStatus(rawStatus) {
        switch(rawStatus){
            case 'SALE_APPROVED':
                return 'approved';
            case 'SALE_REJECTED':
                return 'rejected';
            case 'VOID_APPROVED':
                return 'rejected' // anulación aprobada → el pago ya no es válido
                ;
            default:
                return 'pending' // VOID_REJECTED u otros → sin cambio determinante
                ;
        }
    }
    extractWebhookData(body) {
        try {
            const evt = typeof body === 'string' ? JSON.parse(body) : body;
            const orderReference = evt.data?.metadata?.reference;
            const rawStatus = evt.type;
            const paymentId = evt.data?.payment_id ?? evt.subject ?? undefined;
            if (!orderReference || !rawStatus) return null;
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
 * Solo UNA pasarela puede estar activa a la vez: `payment_config.active_provider`
 * ('none' | 'wompi' | 'mercadopago' | 'tucompra'), igual que shipping_config.provider.
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  method        │  Gateway               │  Activa cuando…         │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  'wompi'       │  WompiGateway          │  active_provider='wompi'│
 * │  'mercadopago' │  MercadoPagoGateway    │  = 'mercadopago'        │
 * │  'tucompra'    │  TuCompraGateway       │  = 'tucompra'           │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Adding a new gateway:
 *   1. Create src/providers/payment/<Name>Gateway.ts implementing PaymentGateway.
 *   2. Add credentials to payment_config (migration + types.ts) + al CHECK de active_provider.
 *   3. Add a case below.
 *   4. Add la opción al selector "Proveedor activo" en admin PaymentConfigForm.
 */ __turbopack_context__.s([
    "getActiveGateways",
    ()=>getActiveGateways,
    "getActiveProvider",
    ()=>getActiveProvider,
    "getPaymentGateway",
    ()=>getPaymentGateway
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$WompiGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/WompiGateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$MercadoPagoGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/MercadoPagoGateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$TuCompraGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/TuCompraGateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$BoldGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/providers/payment/BoldGateway.ts [app-route] (ecmascript)");
;
;
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
                if (config.active_provider !== 'wompi') {
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
                if (config.active_provider !== 'mercadopago') {
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
                if (config.active_provider !== 'tucompra') {
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
        case 'bold':
            {
                if (config.active_provider !== 'bold') {
                    throw new Error('Bold no está activo. Actívalo en Configuración → Pagos.');
                }
                if (!config.bold_api_key || !config.bold_secret_key) {
                    throw new Error('Bold: faltan credenciales (api_key o secret_key).');
                }
                return new __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$providers$2f$payment$2f$BoldGateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BoldGateway"]({
                    apiKey: config.bold_api_key,
                    secretKey: config.bold_secret_key,
                    sandbox: config.bold_sandbox ?? true
                });
            }
        default:
            throw new Error(`Pasarela de pago desconocida: "${method}"`);
    }
}
function getActiveProvider(config) {
    switch(config.active_provider){
        case 'wompi':
            return config.wompi_public_key && config.wompi_integrity_secret ? 'wompi' : 'none';
        case 'mercadopago':
            return config.mercadopago_access_token ? 'mercadopago' : 'none';
        case 'tucompra':
            return config.tucompra_merchant_id && config.tucompra_secret_key ? 'tucompra' : 'none';
        case 'bold':
            return config.bold_api_key && config.bold_secret_key ? 'bold' : 'none';
        default:
            return 'none';
    }
}
function getActiveGateways(config) {
    const active = getActiveProvider(config);
    return active === 'none' ? [] : [
        active
    ];
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
"[project]/apps/web/src/app/api/account/cart/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$stack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/stack.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/cart.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$2$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.110.2/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
;
;
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$110$2e$2$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://bitmwhobaoynzmjknupg.supabase.co"), process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getCustomerId(userId) {
    const { data } = await supabase.from('customers').select('id').eq('stack_id', userId).single();
    return data?.id ?? null;
}
async function GET() {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$stack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackServerApp"].getUser();
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'No autorizado'
    }, {
        status: 401
    });
    const customerId = await getCustomerId(user.id);
    if (!customerId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        items: []
    });
    const items = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCartItems"])(customerId);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        items
    });
}
async function POST(req) {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$stack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackServerApp"].getUser();
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'No autorizado'
    }, {
        status: 401
    });
    const customerId = await getCustomerId(user.id);
    if (!customerId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'Cliente no encontrado'
    }, {
        status: 404
    });
    const { items } = await req.json();
    if (!Array.isArray(items)) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'items requerido'
    }, {
        status: 400
    });
    // Skip items missing valid IDs — they can't satisfy the FK constraints
    // (productId is optional on CartItem for legacy reasons; variantId=0 is also invalid)
    const validItems = items.filter((i)=>i.productId && i.productId > 0 && i.variantId && i.variantId > 0);
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["replaceCart"])(customerId, validItems.map((i)=>({
            customer_id: customerId,
            variant_id: i.variantId,
            product_id: i.productId,
            product_name: i.productName,
            variant_label: i.variantLabel,
            qty: i.qty,
            price: i.price,
            image_url: i.imageUrl ?? null
        })));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true
    });
}
async function DELETE() {
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$stack$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stackServerApp"].getUser();
    if (!user) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        error: 'No autorizado'
    }, {
        status: 401
    });
    const customerId = await getCustomerId(user.id);
    if (!customerId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true
    });
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clearCart"])(customerId);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        ok: true
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1_21_ci._.js.map