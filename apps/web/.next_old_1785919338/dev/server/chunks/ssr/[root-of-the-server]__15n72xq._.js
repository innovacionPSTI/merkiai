module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/packages/database/src/types.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Auto-generado con: pnpm db:generate
// Regenerar después de modificar el schema de Supabase
// Formato compatible con @supabase/supabase-js ^2.43.0
__turbopack_context__.s([]);
;
}),
"[project]/packages/database/src/queries/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearCart",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearCart"],
    "createCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createCoupon"],
    "createMediaAsset",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createMediaAsset"],
    "createNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createNavItem"],
    "createOrder",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOrder"],
    "createPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createPage"],
    "createPageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createPageSection"],
    "createSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSectionItem"],
    "createTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createTheme"],
    "createVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createVariantType"],
    "deleteCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteCoupon"],
    "deleteMediaAsset",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteMediaAsset"],
    "deleteNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteNavItem"],
    "deletePage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deletePage"],
    "deletePageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deletePageSection"],
    "deleteSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSectionItem"],
    "deleteTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteTheme"],
    "deleteVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteVariantType"],
    "getActiveTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getActiveTheme"],
    "getAllNavItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllNavItems"],
    "getBestSellingProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBestSellingProducts"],
    "getBlogPostBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPostBySlug"],
    "getBlogPostBySlugAny",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPostBySlugAny"],
    "getBlogPosts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPosts"],
    "getCartItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCartItems"],
    "getCategories",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCategories"],
    "getCouponByCode",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCouponByCode"],
    "getCoupons",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCoupons"],
    "getFeaturedPost",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeaturedPost"],
    "getFeaturedProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeaturedProducts"],
    "getFooterPages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFooterPages"],
    "getMediaAssets",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getMediaAssets"],
    "getNavTree",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNavTree"],
    "getOrderById",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrderById"],
    "getOrdersByCustomer",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrdersByCustomer"],
    "getOrdersByCustomerEmail",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrdersByCustomerEmail"],
    "getPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPage"],
    "getPageBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageBySlug"],
    "getPageSections",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageSections"],
    "getPageWithSections",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageWithSections"],
    "getPages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPages"],
    "getPaymentConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$payment$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPaymentConfig"],
    "getProductBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProductBySlug"],
    "getProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProducts"],
    "getSectionItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSectionItems"],
    "getShippingConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getShippingConfig"],
    "getShippingProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$profile$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getShippingProfile"],
    "getStoreConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoreConfig"],
    "getThemes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getThemes"],
    "getVariantTypeById",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getVariantTypeById"],
    "getVariantTypes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getVariantTypes"],
    "getWebHomeData",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$home$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWebHomeData"],
    "incrementCouponUsage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementCouponUsage"],
    "removeCartItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeCartItem"],
    "replaceCart",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["replaceCart"],
    "setActiveTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setActiveTheme"],
    "updateCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateCoupon"],
    "updateMediaAssetAlt",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateMediaAssetAlt"],
    "updateNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateNavItem"],
    "updateOrderStatus",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateOrderStatus"],
    "updatePage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePage"],
    "updatePageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePageSection"],
    "updatePaymentConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$payment$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePaymentConfig"],
    "updateSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateSectionItem"],
    "updateShippingConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateShippingConfig"],
    "updateStoreConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateStoreConfig"],
    "updateTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateTheme"],
    "updateVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateVariantType"],
    "upsertCartItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["upsertCartItem"],
    "upsertShippingProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$profile$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["upsertShippingProfile"],
    "validateCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateCoupon"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/queries/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$products$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/products.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$orders$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/orders.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$blog$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/blog.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/shipping-config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/store-config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$payment$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/payment-config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$shipping$2d$profile$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/shipping-profile.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$coupons$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/coupons.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$cart$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/cart.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$themes$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/themes.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$variant$2d$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/variant-types.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/content.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$nav$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/nav.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$media$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/media.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$home$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/home.ts [app-rsc] (ecmascript)");
}),
"[project]/packages/database/src/lib/email.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendShippingNotification",
    ()=>sendShippingNotification,
    "sendStatusNotification",
    ()=>sendStatusNotification
]);
/**
 * Utilidades de email transaccional compartidas entre apps/web y apps/admin.
 * Usa la API REST de Resend directamente (sin SDK) — sin dependencias externas.
 *
 * Las funciones específicas de cada app (sendOrderConfirmation, sendWelcomeEmail,
 * sendNewsletterConfirmation, buildEmailConfig) permanecen en cada app.
 */ const RESEND_API_URL = 'https://api.resend.com/emails';
async function sendEmail(config, payload) {
    const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error ${res.status}: ${err}`);
    }
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
"[project]/packages/database/src/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearCart",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearCart"],
    "createBrowserClient",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createBrowserClient"],
    "createCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createCoupon"],
    "createMediaAsset",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createMediaAsset"],
    "createNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createNavItem"],
    "createOrder",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createOrder"],
    "createPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createPage"],
    "createPageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createPageSection"],
    "createSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSectionItem"],
    "createServerClient",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"],
    "createTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createTheme"],
    "createVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createVariantType"],
    "deleteCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteCoupon"],
    "deleteMediaAsset",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteMediaAsset"],
    "deleteNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteNavItem"],
    "deletePage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deletePage"],
    "deletePageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deletePageSection"],
    "deleteSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSectionItem"],
    "deleteTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteTheme"],
    "deleteVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteVariantType"],
    "getActiveTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getActiveTheme"],
    "getAllNavItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllNavItems"],
    "getBestSellingProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBestSellingProducts"],
    "getBlogPostBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPostBySlug"],
    "getBlogPostBySlugAny",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPostBySlugAny"],
    "getBlogPosts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getBlogPosts"],
    "getCartItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCartItems"],
    "getCategories",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCategories"],
    "getCouponByCode",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCouponByCode"],
    "getCoupons",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCoupons"],
    "getFeaturedPost",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeaturedPost"],
    "getFeaturedProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFeaturedProducts"],
    "getFooterPages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getFooterPages"],
    "getMediaAssets",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getMediaAssets"],
    "getNavTree",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNavTree"],
    "getOrderById",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrderById"],
    "getOrdersByCustomer",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrdersByCustomer"],
    "getOrdersByCustomerEmail",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getOrdersByCustomerEmail"],
    "getPage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPage"],
    "getPageBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageBySlug"],
    "getPageSections",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageSections"],
    "getPageWithSections",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageWithSections"],
    "getPages",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPages"],
    "getPaymentConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPaymentConfig"],
    "getProductBySlug",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProductBySlug"],
    "getProducts",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProducts"],
    "getSectionItems",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSectionItems"],
    "getShippingConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getShippingConfig"],
    "getShippingProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getShippingProfile"],
    "getStoreConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoreConfig"],
    "getThemes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getThemes"],
    "getVariantTypeById",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getVariantTypeById"],
    "getVariantTypes",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getVariantTypes"],
    "getWebHomeData",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWebHomeData"],
    "incrementCouponUsage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["incrementCouponUsage"],
    "removeCartItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["removeCartItem"],
    "replaceCart",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["replaceCart"],
    "sendShippingNotification",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendShippingNotification"],
    "sendStatusNotification",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sendStatusNotification"],
    "setActiveTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setActiveTheme"],
    "updateCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateCoupon"],
    "updateMediaAssetAlt",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateMediaAssetAlt"],
    "updateNavItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateNavItem"],
    "updateOrderStatus",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateOrderStatus"],
    "updatePage",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePage"],
    "updatePageSection",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePageSection"],
    "updatePaymentConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updatePaymentConfig"],
    "updateSectionItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateSectionItem"],
    "updateShippingConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateShippingConfig"],
    "updateStoreConfig",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateStoreConfig"],
    "updateTheme",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateTheme"],
    "updateVariantType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateVariantType"],
    "upsertCartItem",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["upsertCartItem"],
    "upsertShippingProfile",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["upsertShippingProfile"],
    "validateCoupon",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["validateCoupon"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$types$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/types.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/client.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$lib$2f$email$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/lib/email.ts [app-rsc] (ecmascript)");
}),
"[project]/apps/web/src/components/sections/HeroSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HeroSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
;
;
function HeroSection({ section }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "relative h-[80vh] min-h-[500px] flex items-end overflow-hidden bg-brand-primary",
        children: [
            section.image_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                src: section.image_url,
                alt: section.title ?? '',
                className: "absolute inset-0 w-full h-full object-cover"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                lineNumber: 12,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-brand-text/40"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full",
                children: [
                    section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-display text-brand-cream leading-none mb-6",
                        style: {
                            fontSize: 'clamp(3rem, 9vw, 7rem)'
                        },
                        children: section.title
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                        lineNumber: 21,
                        columnNumber: 11
                    }, this),
                    section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-brand text-brand-cream/80 text-xl mb-10 max-w-2xl",
                        children: section.subtitle
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                        lineNumber: 29,
                        columnNumber: 11
                    }, this),
                    section.body && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-brand text-brand-cream/70 text-base mb-8 max-w-xl",
                        children: section.body
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this),
                    section.cta_label && section.cta_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: section.cta_url,
                        className: "inline-block bg-brand-cream text-brand-primary rounded-full px-8 py-4 font-brand font-medium text-lg hover:bg-white transition-colors",
                        children: section.cta_label
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                        lineNumber: 39,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/components/sections/HeroSection.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/sections/TextSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TextSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function TextSection({ section }) {
    if (!section.title && !section.body) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl mx-auto px-6",
            children: [
                section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "font-display text-brand-primary text-section mb-10",
                    children: section.title
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
                    lineNumber: 14,
                    columnNumber: 11
                }, this),
                section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-brand text-brand-primary/70 text-xl mb-8 leading-relaxed",
                    children: section.subtitle
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
                    lineNumber: 19,
                    columnNumber: 11
                }, this),
                section.body && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6 font-brand text-brand-primary/70 text-lg leading-relaxed",
                    children: section.body.split('\n\n').map((paragraph, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: paragraph
                        }, i, false, {
                            fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
                            lineNumber: 26,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
                    lineNumber: 24,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
            lineNumber: 12,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/components/sections/TextSection.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/sections/CardsSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CardsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function CardsSection({ section, items }) {
    const enabled = items.filter((i)=>i.enabled);
    if (enabled.length === 0 && !section.title) return null;
    const cols = enabled.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : enabled.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24 bg-brand-cream-warm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-6",
            children: [
                section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "font-display text-brand-primary text-section text-center mb-4",
                    children: section.title
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                    lineNumber: 23,
                    columnNumber: 11
                }, this),
                section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-brand text-brand-primary/60 text-center mb-14 max-w-xl mx-auto",
                    children: section.subtitle
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                    lineNumber: 28,
                    columnNumber: 11
                }, this),
                !section.subtitle && section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-14"
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                    lineNumber: 32,
                    columnNumber: 48
                }, this),
                enabled.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `grid ${cols} gap-6`,
                    children: enabled.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-3xl p-8 shadow-card flex gap-5",
                            children: [
                                item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-4xl flex-shrink-0",
                                    children: item.icon
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                                    lineNumber: 39,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        item.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-brand font-semibold text-brand-primary text-lg mb-2",
                                            children: item.title
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                                            lineNumber: 43,
                                            columnNumber: 21
                                        }, this),
                                        item.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-brand text-brand-primary/60 text-sm leading-relaxed",
                                            children: item.description
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                                            lineNumber: 48,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                                    lineNumber: 41,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, item.id, true, {
                            fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                            lineNumber: 37,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                    lineNumber: 35,
                    columnNumber: 11
                }, this),
                section.cta_label && section.cta_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: section.cta_url,
                        className: "inline-block bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors",
                        children: section.cta_label
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                        lineNumber: 60,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
                    lineNumber: 59,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
            lineNumber: 21,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/components/sections/CardsSection.tsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/sections/FaqSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FaqSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function FaqSection({ section, items }) {
    const enabled = items.filter((i)=>i.enabled && i.question);
    if (enabled.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24 bg-brand-cream-warm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-3xl mx-auto px-6",
            children: [
                section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "font-display text-brand-primary text-section text-center mb-4",
                    children: section.title
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                    lineNumber: 16,
                    columnNumber: 11
                }, this),
                section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-brand text-brand-primary/60 text-center mb-14",
                    children: section.subtitle
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                    lineNumber: 21,
                    columnNumber: 11
                }, this),
                !section.subtitle && section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-14"
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                    lineNumber: 25,
                    columnNumber: 48
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-4",
                    children: enabled.map((faq)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                            className: "bg-white rounded-2xl shadow-sm group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                    className: "flex justify-between items-center p-6 cursor-pointer font-brand font-semibold text-brand-primary list-none",
                                    children: [
                                        faq.question,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: 2,
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                d: "M19 9l-7 7-7-7"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                                                lineNumber: 39,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                                            lineNumber: 32,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                                    lineNumber: 30,
                                    columnNumber: 15
                                }, this),
                                faq.answer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "px-6 pb-6 font-brand text-sm text-brand-primary/70 leading-relaxed",
                                    children: faq.answer
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                                    lineNumber: 43,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, faq.id, true, {
                            fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                            lineNumber: 29,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                section.cta_label && section.cta_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: section.cta_url,
                        className: "inline-block bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors",
                        children: section.cta_label
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                        lineNumber: 53,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
                    lineNumber: 52,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/components/sections/FaqSection.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/sections/CtaSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CtaSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
;
;
function CtaSection({ section }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24 bg-brand-cream text-center",
        children: [
            section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "font-display text-brand-primary text-section mb-6 px-6",
                children: section.title
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
                lineNumber: 12,
                columnNumber: 9
            }, this),
            section.body && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-brand text-brand-primary/60 mb-10 max-w-xl mx-auto px-6",
                children: section.body
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
                lineNumber: 17,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-4 justify-center flex-wrap px-6",
                children: [
                    section.cta_label && section.cta_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                        href: section.cta_url,
                        className: "bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-dark transition-colors",
                        children: section.cta_label
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
                        lineNumber: 23,
                        columnNumber: 11
                    }, this),
                    section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "w-full font-brand text-brand-primary/50 text-sm mt-2",
                        children: section.subtitle
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
                        lineNumber: 31,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/components/sections/CtaSection.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx <module evaluation>", "default");
}),
"[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx", "default");
}),
"[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$testimonials$2f$TestimonialsCarousel$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$testimonials$2f$TestimonialsCarousel$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$testimonials$2f$TestimonialsCarousel$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/apps/web/src/components/sections/TestimonialsSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TestimonialsSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$testimonials$2f$TestimonialsCarousel$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/testimonials/TestimonialsCarousel.tsx [app-rsc] (ecmascript)");
;
;
function TestimonialsSection({ section, testimonials }) {
    if (testimonials.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24 bg-brand-primary overflow-hidden",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-6",
            children: [
                section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "font-display text-brand-cream text-section text-center mb-14",
                    children: section.title
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/TestimonialsSection.tsx",
                    lineNumber: 16,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$testimonials$2f$TestimonialsCarousel$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                    testimonials: testimonials
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/TestimonialsSection.tsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/components/sections/TestimonialsSection.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/components/sections/TestimonialsSection.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/lib/whatsapp.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getWhatsAppNumber",
    ()=>getWhatsAppNumber,
    "getWhatsAppURL",
    ()=>getWhatsAppURL
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/store-config.ts [app-rsc] (ecmascript)");
;
/**
 * Mensajes predeterminados por tipo de servicio.
 * Los seeds del sitio concreto pueden usar cualquier clave string;
 * si no existe aquí se usa el mensaje genérico.
 */ const DEFAULT_MESSAGES = {
    maquila: 'Hola, quiero información sobre los servicios de maquila.',
    asesoria: 'Hola, quiero información sobre las asesorías disponibles.',
    general: 'Hola, quisiera más información.'
};
async function getWhatsAppNumber() {
    const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoreConfig"])().catch(()=>null);
    return config?.whatsapp_number ?? '573XXXXXXXXX';
}
async function getWhatsAppURL(messageType = 'general') {
    const number = await getWhatsAppNumber();
    const text = DEFAULT_MESSAGES[messageType] ?? DEFAULT_MESSAGES.general;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
}),
"[project]/apps/web/src/components/sections/WhatsAppSection.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WhatsAppSection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/whatsapp.ts [app-rsc] (ecmascript)");
;
;
async function WhatsAppSection({ section, whatsappNumber }) {
    // settings.message_type can be 'asesoria' | 'maquila' | 'general'
    const settings = section.settings;
    const msgType = settings?.message_type ?? 'general';
    const waUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$whatsapp$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getWhatsAppURL"])(msgType).catch(()=>`https://wa.me/${whatsappNumber ?? ''}`);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-24 bg-brand-cream-warm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-2xl mx-auto px-6 text-center",
            children: [
                section.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "font-display text-brand-primary text-section mb-3",
                    children: section.title
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                    lineNumber: 19,
                    columnNumber: 11
                }, this),
                section.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-brand text-brand-primary/60 mb-10",
                    children: section.subtitle
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                    lineNumber: 24,
                    columnNumber: 11
                }, this),
                section.body && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-brand text-brand-primary/60 mb-10",
                    children: section.body
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                    lineNumber: 27,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: waUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "inline-flex items-center gap-3 bg-[#25D366] text-white rounded-full px-8 py-4 font-brand font-medium text-lg hover:bg-[#1ebe5d] transition-colors",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-6 h-6",
                            fill: "currentColor",
                            viewBox: "0 0 24 24",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                                lineNumber: 36,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this),
                        section.cta_label ?? 'Contactar por WhatsApp'
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
            lineNumber: 17,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/components/sections/WhatsAppSection.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/components/sections/SectionRenderer.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * SectionRenderer
 *
 * Componente de servidor que despacha una page_section al componente
 * visual correcto según su section_type.
 *
 * Tipos soportados:
 *   hero         → HeroSection      (imagen, título, subtítulo, CTA)
 *   text         → TextSection      (título + cuerpo de texto)
 *   cards        → CardsSection     (grid de tarjetas con ítems)
 *   faq          → FaqSection       (acordeón de preguntas/respuestas)
 *   cta          → CtaSection       (llamada a acción centrada)
 *   testimonials → TestimonialsSection (carrusel de testimonios)
 *   whatsapp     → WhatsAppSection  (botón/formulario de WhatsApp)
 */ __turbopack_context__.s([
    "default",
    ()=>SectionRenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$HeroSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/HeroSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$TextSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/TextSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$CardsSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/CardsSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$FaqSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/FaqSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$CtaSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/CtaSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$TestimonialsSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/TestimonialsSection.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$WhatsAppSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/WhatsAppSection.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
async function SectionRenderer({ section, pageKey, whatsappNumber }) {
    if (!section.enabled) return null;
    switch(section.section_type){
        case 'hero':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$HeroSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 38,
                columnNumber: 14
            }, this);
        case 'text':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$TextSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 41,
                columnNumber: 14
            }, this);
        case 'cards':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$CardsSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section,
                items: section.items
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 44,
                columnNumber: 14
            }, this);
        case 'faq':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$FaqSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section,
                items: section.items
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 47,
                columnNumber: 14
            }, this);
        case 'cta':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$CtaSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 50,
                columnNumber: 14
            }, this);
        case 'testimonials':
            {
                const settings = section.settings;
                const filterByPage = settings?.filter_by_page === true;
                const testimonials = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getTestimonials"])(true, filterByPage ? pageKey : undefined).catch(()=>[]);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$TestimonialsSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                    section: section,
                    testimonials: testimonials
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                    lineNumber: 59,
                    columnNumber: 14
                }, this);
            }
        case 'whatsapp':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$WhatsAppSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section,
                whatsappNumber: whatsappNumber
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 63,
                columnNumber: 14
            }, this);
        default:
            // Tipo desconocido: renderizar como texto plano para no perder contenido
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$TextSection$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/sections/SectionRenderer.tsx",
                lineNumber: 67,
                columnNumber: 14
            }, this);
    }
}
}),
"[project]/apps/web/src/app/(public)/[slug]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Ruta dinámica para páginas CMS gestionadas desde el admin.
 *
 * Funcionamiento:
 *   1. Busca la página por slug en la tabla `pages`
 *   2. Carga sus secciones + ítems con getPageWithSections()
 *   3. Renderiza cada sección con SectionRenderer
 *
 * Las rutas explícitas (/, /tienda, /blog, /checkout, /mi-cuenta…)
 * tienen prioridad sobre esta ruta dinámica en Next.js.
 *
 * No contiene ningún string específico de café o dominio.
 */ __turbopack_context__.s([
    "default",
    ()=>CmsPage,
    "dynamic",
    ()=>dynamic,
    "generateMetadata",
    ()=>generateMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/database/src/index.ts [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/content.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/database/src/queries/store-config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$SectionRenderer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/sections/SectionRenderer.tsx [app-rsc] (ecmascript)");
;
;
;
;
const dynamic = 'force-dynamic';
async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageWithSections"])(slug).catch(()=>null);
    if (!page) return {};
    return {
        title: page.meta_title ?? page.label,
        description: page.meta_description ?? undefined
    };
}
async function CmsPage({ params }) {
    const { slug } = await params;
    const [pageData, config] = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$content$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPageWithSections"])(slug, true).catch(()=>null),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$database$2f$src$2f$queries$2f$store$2d$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStoreConfig"])().catch(()=>null)
    ]);
    if (!pageData) (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-brand-cream min-h-screen pt-16",
        children: pageData.sections.map((section)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$sections$2f$SectionRenderer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                section: section,
                pageKey: pageData.key,
                whatsappNumber: config?.whatsapp_number
            }, section.id, false, {
                fileName: "[project]/apps/web/src/app/(public)/[slug]/page.tsx",
                lineNumber: 48,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(public)/[slug]/page.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
}),
"[project]/apps/web/src/app/(public)/[slug]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/web/src/app/(public)/[slug]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__15n72xq._.js.map