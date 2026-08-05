(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/src/store/cart.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useCartStore",
    ()=>useCartStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zustand$40$4$2e$5$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_react$40$19$2e$2$2e$7$2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zustand@4.5.7_@types+react@18.3.31_react@19.2.7/node_modules/zustand/esm/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zustand$40$4$2e$5$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_react$40$19$2e$2$2e$7$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zustand@4.5.7_@types+react@18.3.31_react@19.2.7/node_modules/zustand/esm/middleware.mjs [app-client] (ecmascript)");
;
;
/** Topa la cantidad al stock disponible, salvo que el producto permita backorder. */ function clampQty(qty, item) {
    if (item.allowBackorder || item.stock == null) return Math.max(1, qty);
    return Math.max(1, Math.min(qty, item.stock));
}
async function pushToServer(items) {
    try {
        await fetch('/api/account/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items
            })
        });
    } catch  {
    // Non-critical: local state is still valid
    }
}
const useCartStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zustand$40$4$2e$5$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_react$40$19$2e$2$2e$7$2f$node_modules$2f$zustand$2f$esm$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["create"])()((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zustand$40$4$2e$5$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_react$40$19$2e$2$2e$7$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["persist"])((set, get)=>({
        items: [],
        addItem: (item)=>{
            set((state)=>{
                const existing = state.items.find((i)=>i.variantId === item.variantId);
                const newItems = existing ? state.items.map((i)=>i.variantId === item.variantId ? {
                        ...i,
                        qty: clampQty(i.qty + item.qty, item)
                    } : i) : [
                    ...state.items,
                    {
                        ...item,
                        qty: clampQty(item.qty, item)
                    }
                ];
                return {
                    items: newItems
                };
            });
            // Fire-and-forget sync
            pushToServer(get().items);
        },
        removeItem: (variantId)=>{
            set((state)=>({
                    items: state.items.filter((i)=>i.variantId !== variantId)
                }));
            pushToServer(get().items);
        },
        updateQty: (variantId, qty)=>{
            if (qty <= 0) {
                get().removeItem(variantId);
                return;
            }
            set((state)=>({
                    items: state.items.map((i)=>i.variantId === variantId ? {
                            ...i,
                            qty: clampQty(qty, i)
                        } : i)
                }));
            pushToServer(get().items);
        },
        clearCart: ()=>{
            set({
                items: []
            });
            try {
                fetch('/api/account/cart', {
                    method: 'DELETE'
                }).catch(()=>{});
            } catch  {}
        },
        subtotal: ()=>get().items.reduce((acc, i)=>acc + i.price * i.qty, 0),
        total: ()=>get().subtotal(),
        syncToServer: async ()=>{
            const { items } = get();
            if (items.length > 0) await pushToServer(items);
        },
        loadFromServer: async ()=>{
            try {
                const res = await fetch('/api/account/cart');
                if (!res.ok) return;
                const { items: serverItems } = await res.json();
                if (!serverItems?.length) return;
                // Merge: local items take precedence for qty, server adds missing items
                const local = get().items;
                const merged = [
                    ...local
                ];
                for (const si of serverItems){
                    const localItem = merged.find((i)=>i.variantId === si.variant_id);
                    if (!localItem) {
                        merged.push({
                            variantId: si.variant_id,
                            productId: si.product_id,
                            productSlug: '',
                            productName: si.product_name,
                            variantLabel: si.variant_label,
                            price: Number(si.price),
                            qty: si.qty,
                            imageUrl: si.image_url ?? undefined,
                            weight: undefined
                        });
                    }
                }
                set({
                    items: merged
                });
            } catch  {}
        }
    }), {
    name: 'vps-cart',
    storage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zustand$40$4$2e$5$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_react$40$19$2e$2$2e$7$2f$node_modules$2f$zustand$2f$esm$2f$middleware$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createJSONStorage"])(()=>localStorage)
}));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/components/auth/CartSyncOnLogin.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CartSyncOnLogin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.10_@babel+core@7.29.7_@opentelemetry+api@1.9.1_react-dom@19.2.7_react@19.2.7__react@19.2.7/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@stackframe+stack@2.8.108_@types+react-dom@18.3.7_@types+react@18.3.31__@types+react@18.3.31__tqjf7xvnucvjx6rf5f5n65ykji/node_modules/@stackframe/stack/dist/esm/lib/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$store$2f$cart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/store/cart.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function CartSyncOnLogin() {
    _s();
    const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"])({
        or: 'return-null'
    });
    const syncToServer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$store$2f$cart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"])({
        "CartSyncOnLogin.useCartStore[syncToServer]": (s)=>s.syncToServer
    }["CartSyncOnLogin.useCartStore[syncToServer]"]);
    const loadFromServer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$store$2f$cart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"])({
        "CartSyncOnLogin.useCartStore[loadFromServer]": (s)=>s.loadFromServer
    }["CartSyncOnLogin.useCartStore[loadFromServer]"]);
    const prevUserIdRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$10_$40$babel$2b$core$40$7$2e$29$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_react$2d$dom$40$19$2e$2$2e$7_react$40$19$2e$2$2e$7_$5f$react$40$19$2e$2$2e$7$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CartSyncOnLogin.useEffect": ()=>{
            const currentId = user?.id ?? null;
            // Trigger only when transitioning from logged-out → logged-in
            if (currentId && currentId !== prevUserIdRef.current) {
                syncToServer().then({
                    "CartSyncOnLogin.useEffect": ()=>loadFromServer()
                }["CartSyncOnLogin.useEffect"]);
            }
            prevUserIdRef.current = currentId;
        }
    }["CartSyncOnLogin.useEffect"], [
        user?.id,
        syncToServer,
        loadFromServer
    ]);
    return null;
}
_s(CartSyncOnLogin, "gsOooinBG4N3wL7QJKHrFKG+CaQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$stackframe$2b$stack$40$2$2e$8$2e$108_$40$types$2b$react$2d$dom$40$18$2e$3$2e$7_$40$types$2b$react$40$18$2e$3$2e$31_$5f40$types$2b$react$40$18$2e$3$2e$31_$5f$tqjf7xvnucvjx6rf5f5n65ykji$2f$node_modules$2f40$stackframe$2f$stack$2f$dist$2f$esm$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUser"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$store$2f$cart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$store$2f$cart$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"]
    ];
});
_c = CartSyncOnLogin;
var _c;
__turbopack_context__.k.register(_c, "CartSyncOnLogin");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_1achu38._.js.map