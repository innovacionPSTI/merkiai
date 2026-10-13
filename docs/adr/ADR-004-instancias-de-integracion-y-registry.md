# ADR-004 · Instancias de integración (multi-config) + registry de proveedores

Estado: **Implementado para PAGOS y CORREO** (HU-275/276/277 ✅, HU-278 correo ✅).
Pendiente: envíos (resto de HU-278) y multi-dominio (HU-279). Fecha: 2026-10.
Migraciones de backfill: e17/27 (pagos), e17/28 (envíos+correo).
Relacionado: HU-271..274 (patrón de recursos UI), HU-272 (Pagos lista + wizard).

## Secuencia de despliegue (pagos)

1. Desplegar el código (runtime ya resuelve por instancia con fallback a legacy).
2. Aplicar migraciones `e17/26` (tabla) y `e17/27` (backfill payment_config →
   instancias). Ya es seguro: el admin escribe instancias y el runtime las lee.
3. Verificar en Admin → Pagos que las pasarelas aparezcan como instancias.
4. Probar un pago en sandbox.
5. Más adelante (HU futura): retirar columnas legacy de `payment_config` tras
   confirmar en producción.

## Contexto

El modelo actual de integraciones (pagos, envíos, correo) guarda **una sola
configuración por proveedor** en columnas fijas de una tabla única por tenant
(p. ej. `payment_config.wompi_public_key`, `..._integrity_secret`, …). Esto
impide casos reales que el negocio necesita:

- Tener a la vez una configuración **Pruebas** y otra **Producción** del mismo
  proveedor (p. ej. dos Wompi), guardadas y conmutables.
- Varias configuraciones de **producción** del mismo proveedor con **cuentas de
  banco distintas** (manejo interno del comerciante), cada una con una
  **etiqueta/descripción interna** para distinguirlas.
- Que al **agregar un proveedor nuevo** a la plataforma (otra pasarela, otra
  transportadora, otro proveedor de correo) **aparezca automáticamente** en la
  lista de "Agregar", sin reescribir la UI.

El rediseño de Pagos (HU-272) ya introdujo el patrón "lista de recursos +
wizard", pero sigue atado al modelo de una config por proveedor.

## Decisión

1. **Instancias de integración.** Sustituir las columnas fijas por una tabla de
   **instancias**: cada fila es una configuración concreta de un proveedor.

   ```
   integration_instances
     id            uuid pk
     tenant_id     uuid           -- RLS por tenant
     kind          text           -- 'payment' | 'shipping' | 'email'
     provider      text           -- 'wompi' | 'mercadopago' | 'skydropx' | 'resend' | …
     label         text           -- etiqueta INTERNA (admin), p. ej. "Wompi cuenta A"
     environment   text           -- 'test' | 'production'
     credentials   jsonb          -- secretos (cifrados en reposo / ref a secret manager)
     enabled       boolean
     is_active     boolean        -- la instancia que opera (ver regla de activación)
     created_at / updated_at
   ```

   - **Single-active se conserva**: por `(tenant_id, kind)` solo una instancia
     con `is_active = true` (índice parcial único). Se guardan muchas, cobra/opera una.
   - La etiqueta es **interna** (no se muestra al cliente en esta etapa).
   - Los secretos **nunca** se devuelven al cliente (enmascarado), igual que hoy.

2. **Registry de proveedores (dirigido por datos).** Un catálogo declarativo
   (código o tabla) donde cada proveedor describe: `kind`, `provider`, nombre
   visible, descripción, **campos requeridos** (para render del wizard),
   detección de entorno y función de **verificación**. La UI (ResourceList +
   WizardModal) se construye desde el registry → un proveedor nuevo = una
   entrada en el registry, sin tocar la UI. Aplica a **pagos, envíos y correo**.

3. **Resolución en runtime.** Checkout/webhooks/reconcile dejan de leer columnas
   fijas y resuelven la **instancia activa** por `(tenant_id, kind='payment')`.
   El `PaymentGateway`/`HostingProvider`/email provider se instancian desde
   `credentials` de esa fila. La abstracción de gateway (ADR previo) ya aísla esto.

## Consecuencias

- Migración de datos: `payment_config`/`shipping_config`/config de correo →
  filas en `integration_instances` (una por proveedor configurado, env inferido).
- Refactor de checkout, webhooks y reconcile para resolver por instancia activa.
- UI: el wizard pasa a ser **data-driven** desde el registry (menos código por proveedor).
- Beneficio: multi-config real, catálogo extensible y un patrón único para las
  tres familias de integración.

## Alternativa intermedia (implementada ya)

Mientras se aborda la Épica, Pagos queda en **una config por proveedor** con:
indicador de **entorno** explícito en el wizard, lista de solo lo configurado,
y acciones Editar/Verificar/Activar/Quitar. Suficiente para el MVP.

## Plan (HUs)

- **HU-275** · Tabla `integration_instances` + RLS + migración desde configs actuales (pagos primero).
- **HU-276** · Registry de proveedores (declarativo) + wizard data-driven; pagos como primer consumidor.
- **HU-277** · Resolver checkout/webhooks/reconcile por instancia activa (pagos).
- **HU-278** · Extender instancias + registry a **envíos** y **correo** (misma UI).
