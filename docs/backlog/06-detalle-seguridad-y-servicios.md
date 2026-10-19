## Detalle · E14 — Seguridad transversal y hardening (HU-202…206, HU-297…300)

> Refuerza la seguridad más allá de lo ya hecho (CSP básica + rate-limit HU-062 ✅; firmas/idempotencia/anti-subpago en webhooks ✅; PCI SAQ A HU-184…187; RLS). Cubre CORS, XSS, abuso, validación, secretos y dependencias. Todo **🔲 (roadmap)**.

### HU-202 — Política CORS + hardening de endpoints internos/API · E14
> Como plataforma, quiero una política CORS explícita y endpoints internos blindados, para no exponer APIs a orígenes no autorizados.

**Estimación:** M (5 puntos) · **Estado:** 🔶 Parcial — **hecho:** `hasInternalSecret` con comparación timing-safe + rechazo de `Origin` (deny navegador) en los `/api/internal` del console; host validado con charset estricto. Pendiente: allowlist CORS de APIs públicas.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CORS explícito | APIs públicas con allowlist de orígenes (incl. dominios propios de tenants, HU-174); por defecto **deny** cross-origin |
| AC-2 | Internos deny | `/api/internal/*` (console) rechazan cross-origin y navegador; solo server-to-server |
| AC-3 | Comparación segura | Secretos internos comparados con **timing-safe** (no `===`); host validado con charset estricto *(hecho para resolve-tenant)* |
| AC-4 | Métodos/headers | Sólo métodos/headers necesarios; sin comodines `*` con credenciales |

### HU-203 — CSP endurecida (nonce) + sanitización XSS de contenido · E14
> Como plataforma, quiero eliminar `unsafe-inline`/`unsafe-eval` y sanitizar el HTML de contenido, para cerrar la superficie XSS.

**Estimación:** L (8 puntos) · **Estado:** 🔶 Parcial — **hecho:** sanitización XSS del contenido de tenant en `markdownToHtml` (escape de HTML + `href` seguro contra `javascript:`/`data:`) + pruebas (`markdown.test.ts`). Pendiente: CSP con nonce (quitar `unsafe-inline`/`unsafe-eval`) y sanitizar cualquier otro HTML no-markdown.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CSP con nonce/hash | Reemplazar `'unsafe-inline'`/`'unsafe-eval'` por nonce/hash en las 3 apps (web/admin/console) |
| AC-2 | Sanitización | Contenido HTML de tenant (blog, páginas, legales, descripciones) renderizado con `dangerouslySetInnerHTML` pasa por **sanitizer** (DOMPurify/rehype-sanitize) |
| AC-3 | Headers en todas | Security headers (CSP, HSTS, X-Frame-Options, etc.) en web/admin/console y en dominios propios |
| AC-4 | Escapes | Interpolaciones en JSON-LD/estilos verificadas contra inyección |

### HU-204 — Rate limiting distribuido + anti-abuso · E14
> Como plataforma, quiero límites de tasa reales y protección anti-bot, para resistir fuerza bruta y abuso.

**Estimación:** L (8 puntos) · **Estado:** 🔲 Pendiente (roadmap) — reemplaza el rate-limit in-memory por-instancia actual

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Distribuido | Rate limit con store compartido (Upstash/Redis) para login, checkout, newsletter, webhooks y APIs |
| AC-2 | Anti-bot | Captcha/Turnstile en formularios públicos (registro, newsletter, contacto) |
| AC-3 | Brute-force | Backoff/bloqueo por credenciales fallidas (complementa Stack Auth) |
| AC-4 | Por tenant | Cuotas por tenant/plan (se conecta con entitlements HU-173) |

### HU-205 — Validación de entradas + CSRF · E14
> Como plataforma, quiero validar toda entrada en los bordes y proteger las mutaciones con sesión, para evitar inyección y CSRF.

**Estimación:** M (5 puntos) · **Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | zod en bordes | Todos los route handlers validan body/params con **zod**; rechazo 400 uniforme |
| AC-2 | Sin inyección | Filtros de Supabase/PostgREST nunca interpolan entrada sin validar *(fix aplicado en resolve-tenant)* |
| AC-3 | CSRF | Mutaciones autenticadas por cookie verifican origen/token; cookies `SameSite`/`HttpOnly`/`Secure` confirmadas |
| AC-4 | Uploads | Subida de medios valida mime, tamaño y extensión; nombres saneados |

### HU-206 — Gestión de secretos + escaneo de dependencias (SCA) · E14
> Como responsable, quiero rotación de secretos y escaneo continuo de dependencias, para reducir el riesgo de fuga y CVEs.

**Estimación:** M (5 puntos) · **Estado:** 🔲 Pendiente (roadmap) — extiende HU-184 (rotación de llaves de pago) a los demás secretos

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Rotación | Procedimiento de rotación para `INTERNAL_API_SECRET`, `SUPABASE_JWT_SECRET` y llaves de pasarela (HU-184) |
| AC-2 | SCA en CI | Escaneo de dependencias (Dependabot/Snyk) y alertas de CVE en el pipeline |
| AC-3 | Secret scanning | Detección de secretos en commits (pre-commit / GitHub) |
| AC-4 | Mínimo privilegio | Revisión de que ninguna llave sensible esté en `NEXT_PUBLIC_` ni en el cliente |

---

## Detalle · E14 — Hardening de instrumentos de valor y pricing (HU-297…300)

> **Contexto.** Con el cierre de la Ola 1 el storefront maneja varios **instrumentos de valor** que afectan cuánto paga el cliente: **promociones** (HU-147), **precio de campaña VIP** (HU-293), **gift cards** y **saldo a favor** (HU-148), además del cupón y el precio/stock del catálogo. Hoy el checkout ya recalcula buena parte server-side y los descuentos VIP/promos/crédito se aplican en el servidor, pero esa garantía está **dispersa** y nunca se auditó de forma integral. Este bloque consolida un **principio único: el precio y el total son autoridad exclusiva del servidor**, el cliente solo propone intención (ítems, código, "usar saldo"), y **ningún valor monetario enviado por el cliente se confía jamás**. El objetivo es cerrar cualquier vía por la que un usuario pudiera **alterar precios, descuentos, saldos o elegibilidad** para pagar de menos, y evitar **fugas de datos sensibles** (saldos, códigos, pertenencia a segmentos VIP) por las APIs. Todo **🔲 (roadmap)**.
>
> **No-objetivos:** no cambia la experiencia de compra legítima; es endurecimiento + pruebas de abuso. Se apoya en lo ya existente (recalculo en `/api/checkout`, RLS por tenant, `redeemGiftCard` atómico, gating VIP server-side) y lo formaliza, cierra huecos y lo cubre con tests adversariales.

### HU-297 — Pricing autoritativo de extremo a extremo en el checkout · E14 (toca E5/E6)
> Como plataforma, quiero que el checkout **recompute desde la base de datos** cada precio, descuento y total —ignorando los montos que envía el cliente—, para que nadie pueda manipular el valor a pagar desde el navegador o la API.

**Estimación:** L (8 puntos) · **Estado:** 🟡 Parcial (v148) — **hecho:** el checkout recomputa el **subtotal desde los precios ACTUALES de la BD** (variantes + precio de bundle), **recalcula el cupón server-side** desde `coupon_code` y **deriva el total** (subtotal BD + envío − cupón − promo − VIP − crédito); se ignoran `price`/`subtotal`/`total`/`discount` del cliente. Test adversarial (precio/subtotal/total manipulados → corregidos). **Pendiente:** recomputar el envío server-side (AC-4, hoy usa la tarifa seleccionada) y la suite adversarial ampliada (qty negativas/fraccionarias).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Precios de servidor | El `price` unitario de cada ítem se lee de `product_variants` por `variant_id`; se ignora el `price` del body. El `subtotal` se recomputa; discrepancia con el cliente ⇒ se usa el del servidor (no error silencioso) |
| AC-2 | Cadena de descuentos única | Un solo pipeline server-side aplica, en orden determinista y documentado: cupón → promociones (HU-147) → precio VIP (HU-293) → gift card/saldo (HU-148); el `total` final es derivado, nunca recibido |
| AC-3 | Topes e invariantes | `0 ≤ descuentos ≤ subtotal`; el monto cobrado a la pasarela = total derivado; imposible total negativo o cobro menor al debido por combinación de instrumentos |
| AC-4 | Envío y stock | `shipping_cost` recomputado por el motor de envíos (no del cliente); revalidación de stock y de elegibilidad VIP server-side antes de crear la orden |
| AC-5 | Pruebas adversariales | Suite que intenta manipular `price`, `subtotal`, `total`, `discount`, `qty` negativas, cantidades fraccionarias y descuentos encadenados; todas deben fallar o ser corregidas por el servidor |

### HU-298 — Blindaje de gift cards y saldo a favor (anti-doble gasto, sin fugas) · E14 (toca E6)
> Como plataforma, quiero que el canje de gift cards y saldo a favor sea **atómico, idempotente y sin fugas**, para que no se pueda gastar más de lo disponible, reutilizar un canje ni enumerar/leer saldos ajenos.

**Estimación:** L (8 puntos) · **Estado:** 🟡 Parcial (v149) — **hecho:** RPC transaccional `redeem_store_value` (`e17/48`, `SECURITY DEFINER`, chequeo de tenant, **`FOR UPDATE`** de la gift card, revalida vigencia/saldo y aplica el **mínimo** entre lo pedido y lo disponible → sin sobre-gasto bajo concurrencia; gift card + asiento de saldo en **una sola transacción**). El checkout usa el RPC en vez de `redeemGiftCard`+`addStoreCredit` por separado. AC-4/AC-5 (sin fugas + propiedad del saldo por sesión) ya cubiertos. **Pendiente:** envolver también la **creación de la orden** en la transacción (hoy el canje sigue asentándose antes de crear la orden — residual documentado) + clave de idempotencia por intento (AC-2).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Atomicidad transaccional | Validar saldo + decrementar gift card + asentar consumo de saldo + crear la orden en una **transacción** (RPC `SECURITY DEFINER`), de modo que un fallo revierta todo (sin crédito consumido sin orden, ni orden sin crédito) |
| AC-2 | Idempotencia | Reintentos del mismo checkout no doble-descuentan (clave de idempotencia por intento); el ledger de saldo referencia `order_id` y no admite dobles asientos |
| AC-3 | Sin sobre-gasto | Imposible que gift card o saldo queden negativos bajo concurrencia; el crédito aplicado nunca supera el saldo real ni el total |
| AC-4 | Sin fugas en API | `/api/checkout/credit` solo revela el saldo de la gift card consultada y el saldo del **cliente autenticado**; nunca saldos de otros; sin enumeración masiva (ver HU-300). El saldo a favor se lee solo vía RLS `store_credit_own_read` |
| AC-5 | Propiedad del saldo | El saldo a favor solo lo puede gastar su dueño autenticado; un invitado o tercero no puede aplicar el crédito de otra cuenta (verificación server-side de `customer_id` por sesión) |
| AC-6 | Reembolso/consistencia | Anular/expirar una orden pagada con crédito revierte o re-acredita correctamente; trazas en auditoría (HU-146) |

### HU-299 — Enforcement server-side de promociones y acceso/precio VIP · E14 (toca E5/E19)
> Como plataforma, quiero que la elegibilidad y el valor de promociones y campañas VIP se decidan **solo en el servidor**, para que el cliente no pueda forzar un descuento, un precio VIP ni el acceso anticipado al que no tiene derecho.

**Estimación:** M (5 puntos) · **Estado:** ✅ Hecho (v150) — el enforcement ya era server-side (promos `computePromotions` desde BD; gating VIP `findLockedVariants` + precio `computeVipMemberDiscount`). Blindado con **pruebas de evasión**: un `discount` inyectado por el body se ignora (sin cupón/promos el total no baja) y el precio/subtotal/total manipulados se corrigen (HU-297). **Revisión de fugas:** el `offer_percent` y la pertenencia a segmentos **no** se envían a no-miembros (la PDP pasa 0; sólo nombre/fin de campaña para el countdown); ninguna API pública expone campañas/segmentos (se resuelven con cliente-máquina). Cupo bajo concurrencia queda sujeto al endurecimiento general.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Promos no manipulables | El cliente no envía el descuento de promoción; el servidor evalúa reglas, vigencia y combinabilidad desde `promotions`. Un `promotion_id` o porcentaje inyectado en el body se ignora |
| AC-2 | Elegibilidad VIP server-side | La pertenencia al segmento y la ventana se verifican con la sesión + BD; no basta con ocultar en UI. El precio VIP se aplica solo si el servidor confirma `vip_member` dentro de la ventana |
| AC-3 | Gating no evitable | Comprar un producto en campaña (bloqueado para no-miembros) se rechaza en el checkout aunque se llame la API directamente o se manipule la URL |
| AC-4 | Sin fuga de datos VIP | Las APIs no exponen a qué segmentos pertenece un cliente, ni los miembros de un segmento, ni el `offer_percent` a quien no es elegible |
| AC-5 | Cupo/escasez | Si la campaña define cupo, el límite se respeta server-side bajo concurrencia (no se puede exceder recargando o en paralelo) |

### HU-300 — Anti-abuso y auditoría de instrumentos de valor · E14 (toca E13)
> Como plataforma, quiero límites y trazabilidad sobre la validación y el uso de códigos y saldos, para frenar la enumeración de gift cards/cupones y detectar abuso.

**Estimación:** M (5 puntos) · **Estado:** 🟡 Parcial (v151) — **hecho:** respuestas **neutras** en validación de cupón (422 único, no distingue "no existe" de "inválido") + **rate-limit** por IP (in-memory) en `/api/checkout/coupon` y `/api/checkout/credit` (anti-enumeración, AC-1 parcial); **auditoría** (HU-146) de emisión de gift cards (`giftcard.issue`), ajuste de saldo (`storecredit.adjust`) y reembolso como saldo (`return.credit`) con actor/monto (AC-3). **Pendiente:** rate-limit distribuido (depende de HU-204), bloqueo tras N intentos, alertas de abuso (AC-4) y reporte de conciliación emitido vs. canjeado (AC-5 ✅ v152: panel en `/gift-cards` con `getStoreValueReconciliation` — emitido/restante/canjeado de gift cards y abonado/usado/vigente de saldo).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Anti-enumeración | Rate limit por IP/sesión en validación de gift cards, cupones y códigos; respuestas neutras (no distinguir "no existe" de "sin saldo") y sin filtrar la existencia por tiempos |
| AC-2 | Formato robusto | Códigos de alta entropía (ya sin caracteres ambiguos); validación de formato antes de tocar la BD; bloqueo tras N intentos fallidos |
| AC-3 | Auditoría | Emisión/canje/ajuste de gift cards y saldo, aplicación de promociones y de precio VIP quedan en el registro de auditoría (HU-146) con actor, monto y pedido |
| AC-4 | Alertas | Umbrales de abuso (muchos canjes fallidos, saldo que cae anómalamente, picos de redención) notificables al operador |
| AC-5 | Conciliación | Reporte/cuadre de valor emitido vs. canjeado (gift cards y saldo) para detectar descuadres |

---

## Detalle · Preparación para extracción a servicios — endurecer el monolito modular (HU-195…199)

> **Decisión (ago-2026):** *de momento* la app sigue siendo un **monolito modular** (no se extraen microservicios todavía). Pero se adoptan **desde ahora** las prácticas que dejan la costura lista, para que una migración futura a servicios sea mecánica y no un refactor grande. Estas HU no cambian el despliegue actual; endurecen límites, datos, contexto y observabilidad. Todo **🔲 (roadmap)**.

### HU-195 — Endurecer límites de bounded contexts + contratos · E2

> Como arquitecto, quiero que cada dominio tenga una API pública explícita y contratos validados en sus bordes, para poder extraerlo a un servicio sin reescribir a sus consumidores.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (payments, shipping, email, billing, tenancy, inventory), contratos zod, lint de límites
**Estado:** 🔲 Pendiente (roadmap) — **fase actual: prioritario**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | API pública por dominio | Cada dominio expone solo su `index.ts`; prohibido importar internals de otro dominio (regla de lint/CI) |
| AC-2 | Contratos en los bordes | DTOs de entrada/salida validados con **zod** en las fronteras de cada dominio (base del futuro contrato de red) |
| AC-3 | Transporte-agnóstico | La lógica de dominio sigue sin depender de Next (ya se cumple); se mantiene como invariante verificado |
| AC-4 | Providers detrás de interfaz | El patrón interfaz+factory se aplica a **todos** los dominios de integración (pagos/email ya; añadir billing y shipping) |

---

### HU-196 — Capa de eventos de dominio + outbox (async) · E2

> Como plataforma, quiero publicar eventos de dominio de forma confiable (patrón outbox), para desacoplar reacciones (emails, reconcile, IA, webhooks salientes) y tener la línea de corte natural hacia servicios.

**Estimación:** L (8 puntos)
**Módulo:** bus de eventos interno + tabla `outbox`, despacho con reintentos; base para HU-136 (telemetría) y HU-165 (webhooks salientes)
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; hoy no hay capa async

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Publicación confiable | Los cambios de estado (p. ej. `order.paid`, `shipment.created`) escriben un evento en `outbox` **en la misma transacción** que el cambio |
| AC-2 | Despacho | Un despachador entrega los eventos a los consumidores con reintentos/backoff e idempotencia (reusa `processed_webhook_events`) |
| AC-3 | Consumidores desacoplados | Email, reconcile e IA reaccionan a eventos en vez de llamadas in-process directas |
| AC-4 | Costura de servicio | El transporte de eventos es reemplazable por una cola externa (SQS/PubSub/Kafka) sin cambiar los productores/consumidores |
| AC-5 | Multi-tenant | Cada evento porta `tenant_id`; los consumidores fijan el contexto (HU-198) |

---

### HU-197 — Propiedad de datos por dominio (un dominio solo escribe sus tablas) · E2

> Como arquitecto, quiero que cada dominio sea dueño de sus tablas y que lo ajeno se consuma vía API/eventos, para evitar el "monolito distribuido" y permitir BD-por-dominio en el futuro.

**Estimación:** M (5 puntos)
**Módulo:** convención de propiedad de tablas + verificación, refactor de escrituras cross-dominio
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Propiedad declarada | Cada tabla pertenece a un dominio; documentado y verificable |
| AC-2 | Sin escrituras cruzadas | Un dominio **solo escribe sus tablas**; los datos ajenos se leen por su API o se reciben por evento (HU-196) |
| AC-3 | Lecturas explícitas | Las lecturas cross-dominio pasan por la API pública del dueño (HU-195), no por acceso directo a sus tablas |
| AC-4 | Preparado para split | La convención permite mover un dominio a su propio schema/BD sin tocar a sus consumidores |

---

### HU-198 — Propagación del contexto de tenant a través de la red · E17

> Como plataforma multi-tenant, quiero propagar el `tenant_id` de forma confiable y firmada entre procesos/servicios, para no perder el aislamiento al cruzar una frontera de red.

**Estimación:** M (5 puntos)
**Módulo:** `@merkiai/tenancy` (propagación + re-fijado de GUC), headers/tokens firmados
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; depende de HU-156/171

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Contexto portable | El `tenant_id` viaja en un token/header **firmado** en toda llamada entre procesos y en cada evento (HU-196) |
| AC-2 | Re-fijado de RLS | El servicio/consumidor receptor **vuelve a fijar** `app.current_tenant` (GUC) en su propia conexión antes de tocar datos |
| AC-3 | Fail-closed | Sin contexto de tenant válido, la operación se rechaza (nunca se ejecuta sin tenant) |
| AC-4 | Trazabilidad | El `tenant_id` se incluye en trazas/logs (HU-199) para correlación |

---

### HU-199 — Observabilidad distribuida (trazas correlacionadas) · E14

> Como responsable, quiero trazas correlacionadas y logs estructurados con contexto (request, tenant, dominio), para operar de forma fiable cuando la lógica se reparta en procesos/servicios.

**Estimación:** M (5 puntos)
**Módulo:** tracing (OpenTelemetry), correlation id, logs estructurados; extiende HU-170 (APM)
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; extiende HU-170

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Correlation id | Cada request/evento propaga un id de correlación a través de las fronteras |
| AC-2 | Trazas | Instrumentación (OpenTelemetry) que sigue una operación entre módulos/servicios y colas |
| AC-3 | Logs estructurados | Logs con `request_id`, `tenant_id` y dominio; sin PII innecesaria (HU-152) |
| AC-4 | Base para split | La observabilidad ya funciona antes de extraer un servicio, no después del incidente |

---

